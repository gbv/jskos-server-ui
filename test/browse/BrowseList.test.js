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
  item: true,
  hierarchical: false,
  row: null,
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
  item: true,
  hierarchical: true,
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
      stubs: { ItemList: ItemListStub, ConceptTree: ConceptTreeStub },
    },
  })
  const store = useServerStore()
  store.registry = registry
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
