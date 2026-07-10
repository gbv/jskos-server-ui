import { mount, flushPromises } from "@vue/test-utils"
import { createTestingPinia } from "@pinia/testing"
import { useServerStore } from "@/stores/server"
import BrowseList from "@/components/browse/BrowseList.vue"

vi.mock("@/composables/useNotify", () => ({
  useNotify: () => ({ notify: vi.fn() }),
}))

const schemesConfig = {
  capability: "schemes",
  label: "Terminologies",
  registry: "registry",
  list: "getSchemes",
  hierarchical: false,
  listComponent: "items",
}

const ItemListStub = {
  props: ["items"],
  template:
    "<ul class='stub-itemlist'><li v-for='i in items' :key='i.uri'>{{ i.uri }}</li></ul>",
}

const conceptsConfig = {
  capability: "concepts",
  label: "Concepts",
  registry: "registry",
  list: null,
  hierarchical: true,
  listComponent: "items",
}

const mappingsConfig = {
  capability: "mappings",
  label: "Mappings",
  registry: "mappingsRegistry",
  list: "getMappings",
  hierarchical: false,
  listComponent: "mappings",
}

const MappingListStub = {
  props: ["mappings"],
  emits: ["select"],
  template:
    "<ul class='stub-mappinglist'><li v-for='(m, i) in mappings' :key='i' @click=\"$emit('select', { mapping: m })\">{{ m.uri }}</li></ul>",
}

const concordancesConfig = {
  capability: "concordances",
  label: "Concordances",
  registry: "mappingsRegistry",
  list: "getConcordances",
  hierarchical: false,
  listComponent: "concordances",
}

const ConcordanceListStub = {
  props: ["concordances"],
  emits: ["select"],
  template:
    "<ul class='stub-concordancelist'><li v-for='(c, i) in concordances' :key='i' @click=\"$emit('select', { concordance: c })\">{{ c.uri }}</li></ul>",
}

const annotationsConfig = {
  capability: "annotations",
  label: "Annotations",
  registry: "mappingsRegistry",
  list: "getAnnotations",
  hierarchical: false,
  listComponent: "annotations",
}

const AnnotationListStub = {
  props: ["annotations"],
  emits: ["select"],
  template:
    "<ul class='stub-annotationlist'><li v-for='(a, i) in annotations' :key='i' @click=\"$emit('select', { annotation: a })\">{{ a.id }}</li></ul>",
}

// Shared spy for the ConceptTree stub's navigateToUri, reset before each test.
const navigateToUri = vi.fn()
const ConceptTreeStub = {
  props: ["modelValue", "concepts", "scheme", "registry"],
  template: "<div class='stub-concepttree'></div>",
  setup(_, { expose }) {
    expose({ navigateToUri })
  },
}

beforeEach(() => {
  navigateToUri.mockClear()
})

function mountList(registry, config = schemesConfig, props = {}) {
  const wrapper = mount(BrowseList, {
    props: { config, ...props },
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      stubs: {
        ItemList: ItemListStub,
        ConceptTree: ConceptTreeStub,
        MappingList: MappingListStub,
        ConcordanceList: ConcordanceListStub,
        AnnotationList: AnnotationListStub,
      },
    },
  })
  const store = useServerStore()
  store[config.registry] = registry
  return wrapper
}

describe("BrowseList browsing", () => {
  it("loads the first page of records and renders them in the ItemList", async () => {
    const result = Object.assign([{ uri: "urn:a" }, { uri: "urn:b" }], {
      _totalCount: 42,
    })
    const getSchemes = vi.fn().mockResolvedValue(result)
    const wrapper = mountList({ getSchemes })
    await flushPromises()

    expect(getSchemes).toHaveBeenCalledWith({
      params: { limit: 20, offset: 0 },
    })
    expect(wrapper.findAll(".stub-itemlist li")).toHaveLength(2)
    expect(wrapper.text()).toContain("Showing 1–2 of 42")
  })

  it("shows an explicit empty state when a type has no records", async () => {
    const getSchemes = vi.fn().mockResolvedValue(Object.assign([], {}))
    const wrapper = mountList({ getSchemes })
    await flushPromises()

    expect(wrapper.find(".browse-list-empty").exists()).toBe(true)
    expect(wrapper.text()).toContain("This server has no terminologies.")
    expect(wrapper.find(".stub-itemlist").exists()).toBe(false)
    expect(wrapper.find(".browse-list-pagination").exists()).toBe(false)
  })

  it("shows an empty state when the selected scheme has no concepts", async () => {
    const getSchemes = vi.fn().mockResolvedValue([{ uri: "urn:scheme" }])
    const getTop = vi.fn().mockResolvedValue([])
    const wrapper = mountList({ getSchemes, getTop }, conceptsConfig)
    await flushPromises()

    expect(getTop).toHaveBeenCalledWith({ scheme: { uri: "urn:scheme" } })
    expect(wrapper.find(".browse-list-empty").exists()).toBe(true)
    expect(wrapper.text()).toContain("This terminology has no concepts.")
  })

  it("selects the scheme given via the schemeUri prop (deep link)", async () => {
    const schemes = [{ uri: "urn:scheme-1" }, { uri: "urn:scheme-2" }]
    const getSchemes = vi.fn().mockResolvedValue(schemes)
    const getTop = vi.fn().mockResolvedValue([{ uri: "urn:c" }])
    mountList({ getSchemes, getTop }, conceptsConfig, {
      schemeUri: "urn:scheme-2",
    })
    await flushPromises()

    expect(getTop).toHaveBeenCalledWith({ scheme: { uri: "urn:scheme-2" } })
  })

  it("navigates the tree to the deep-linked concept once loaded", async () => {
    const getSchemes = vi.fn().mockResolvedValue([{ uri: "urn:scheme" }])
    const getTop = vi.fn().mockResolvedValue([{ uri: "urn:top" }])
    mountList({ getSchemes, getTop }, conceptsConfig, {
      selectedUri: "urn:concept",
    })
    await flushPromises()

    expect(navigateToUri).toHaveBeenCalledWith("urn:concept", {
      select: false,
    })
  })

  it("renders mappings via MappingList and forwards their selection", async () => {
    const result = Object.assign([{ uri: "urn:m1" }, { uri: "urn:m2" }], {
      _totalCount: 5,
    })
    const getMappings = vi.fn().mockResolvedValue(result)
    const wrapper = mountList({ getMappings }, mappingsConfig)
    await flushPromises()

    expect(getMappings).toHaveBeenCalledWith({
      params: { limit: 20, offset: 0 },
    })
    expect(wrapper.find(".stub-itemlist").exists()).toBe(false)
    expect(wrapper.findAll(".stub-mappinglist li")).toHaveLength(2)
    expect(wrapper.text()).toContain("Showing 1–2 of 5")

    await wrapper.findAll(".stub-mappinglist li")[0].trigger("click")
    expect(wrapper.emitted("select")?.at(-1)).toEqual([
      { record: { uri: "urn:m1" } },
    ])
  })

  it("renders concordances via ConcordanceList and forwards their selection", async () => {
    const result = Object.assign([{ uri: "urn:c1" }, { uri: "urn:c2" }], {
      _totalCount: 7,
    })
    const getConcordances = vi.fn().mockResolvedValue(result)
    const wrapper = mountList({ getConcordances }, concordancesConfig)
    await flushPromises()

    expect(getConcordances).toHaveBeenCalledWith({
      params: { limit: 20, offset: 0 },
    })
    expect(wrapper.findAll(".stub-concordancelist li")).toHaveLength(2)
    expect(wrapper.text()).toContain("Showing 1–2 of 7")

    await wrapper.findAll(".stub-concordancelist li")[0].trigger("click")
    expect(wrapper.emitted("select")?.at(-1)).toEqual([
      { record: { uri: "urn:c1" } },
    ])
  })

  it("renders annotations via AnnotationList and forwards their selection", async () => {
    const result = Object.assign([{ id: "urn:a1" }, { id: "urn:a2" }], {
      _totalCount: 3,
    })
    const getAnnotations = vi.fn().mockResolvedValue(result)
    const wrapper = mountList({ getAnnotations }, annotationsConfig)
    await flushPromises()

    expect(getAnnotations).toHaveBeenCalledWith({
      params: { limit: 20, offset: 0 },
    })
    expect(wrapper.findAll(".stub-annotationlist li")).toHaveLength(2)
    expect(wrapper.text()).toContain("Showing 1–2 of 3")

    await wrapper.findAll(".stub-annotationlist li")[0].trigger("click")
    expect(wrapper.emitted("select")?.at(-1)).toEqual([
      { record: { id: "urn:a1" } },
    ])
  })

  it("shows a natural empty state when the server has no annotations", async () => {
    const getAnnotations = vi.fn().mockResolvedValue(Object.assign([], {}))
    const wrapper = mountList({ getAnnotations }, annotationsConfig)
    await flushPromises()

    expect(wrapper.find(".browse-list-empty").exists()).toBe(true)
    expect(wrapper.text()).toContain("This server has no annotations.")
    expect(wrapper.find(".stub-annotationlist").exists()).toBe(false)
  })

  it("shows a natural empty state when the server has no concordances", async () => {
    const getConcordances = vi.fn().mockResolvedValue(Object.assign([], {}))
    const wrapper = mountList({ getConcordances }, concordancesConfig)
    await flushPromises()

    expect(wrapper.find(".browse-list-empty").exists()).toBe(true)
    expect(wrapper.text()).toContain("This server has no concordances.")
    expect(wrapper.find(".stub-concordancelist").exists()).toBe(false)
  })

  it("shows a natural empty state when the server has no mappings", async () => {
    const getMappings = vi.fn().mockResolvedValue(Object.assign([], {}))
    const wrapper = mountList({ getMappings }, mappingsConfig)
    await flushPromises()

    expect(wrapper.find(".browse-list-empty").exists()).toBe(true)
    expect(wrapper.text()).toContain("This server has no mappings.")
    expect(wrapper.find(".stub-mappinglist").exists()).toBe(false)
  })

  it("emits scheme-change when the user picks another scheme", async () => {
    const schemes = [{ uri: "urn:scheme-1" }, { uri: "urn:scheme-2" }]
    const getSchemes = vi.fn().mockResolvedValue(schemes)
    const getTop = vi.fn().mockResolvedValue([{ uri: "urn:c" }])
    const wrapper = mountList({ getSchemes, getTop }, conceptsConfig)
    await flushPromises()

    wrapper
      .findComponent({ name: "BFormSelect" })
      .vm.$emit("update:modelValue", schemes[1])
    await flushPromises()

    expect(wrapper.emitted("scheme-change")?.at(-1)).toEqual(["urn:scheme-2"])
  })
})
