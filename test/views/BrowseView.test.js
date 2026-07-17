import { mount, flushPromises } from "@vue/test-utils"
import { setActivePinia, createPinia } from "pinia"
import { createTestingPinia } from "@pinia/testing"
import { createRouter, createMemoryHistory } from "vue-router"
import BrowseView from "@/views/BrowseView.vue"

vi.mock("@/composables/useNotify", () => ({
  useNotify: () => ({ notify: vi.fn() }),
}))

const auth = vi.hoisted(() => ({}))

vi.mock("@/composables/useAuth", async () => {
  const { ref } = await import("vue")
  auth.user = ref(null)
  auth.token = ref(null)
  auth.loginPublicKey = ref(null)
  auth.loggedIn = ref(false)
  return { useAuth: () => auth }
})

function createStubRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/terminologies", component: BrowseView },
      { path: "/connection", component: { template: "<div/>" } },
    ],
  })
}

const mappingFixture = {
  uri: "urn:mapping:1",
  type: ["http://www.w3.org/2004/02/skos/core#exactMatch"],
  from: { memberSet: [{ uri: "urn:concept:from" }] },
  to: { memberSet: [{ uri: "urn:concept:to" }] },
}

const concordanceFixture = {
  uri: "urn:concordance:1",
  fromScheme: { uri: "urn:scheme:from", notation: ["A"] },
  toScheme: { uri: "urn:scheme:to", notation: ["B"] },
}

const annotationFixture = {
  id: "urn:annotation:1",
  motivation: "assessing",
  bodyValue: "+1",
  target: "urn:mapping:1",
}

const schemeFixture = { uri: "urn:scheme:1" }

const BrowseListStub = {
  emits: ["select", "scheme-change"],
  data: () => ({
    scheme: schemeFixture,
    mapping: mappingFixture,
    concordance: concordanceFixture,
    annotation: annotationFixture,
  }),
  template:
    "<div class='stub-list'>" +
    "<button class='stub-emit-item' @click=\"$emit('select', { record: scheme })\">i</button>" +
    "<button class='stub-emit-mapping' @click=\"$emit('select', { record: mapping })\">m</button>" +
    "<button class='stub-emit-concordance' @click=\"$emit('select', { record: concordance })\">c</button>" +
    "<button class='stub-emit-annotation' @click=\"$emit('select', { record: annotation })\">a</button>" +
    "</div>",
}

async function mountView(storeState = {}, type = "schemes", { query } = {}) {
  const router = createStubRouter()
  router.push({ path: "/terminologies", query })
  await router.isReady()
  return mount(BrowseView, {
    props: { type },
    global: {
      plugins: [
        createTestingPinia({
          initialState: { server: storeState },
          stubActions: false,
        }),
        router,
      ],
      stubs: {
        ViewTitle: { template: "<h1><slot /></h1>" },
        BrowseList: BrowseListStub,
        BrowseDetail: { template: "<div class='stub-detail'/>" },
      },
    },
  })
}

const conceptCap = {
  concepts: { read: { supported: true, requiresAuth: false } },
}

const cap = { read: { supported: true, requiresAuth: false } }
const authCap = { read: { supported: true, requiresAuth: true } }

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.clearAllMocks()
  auth.user.value = null
  auth.token.value = null
  auth.loginPublicKey.value = null
  auth.loggedIn.value = false
})

describe("BrowseView", () => {
  it("shows 'No server connected' when not connected", async () => {
    const wrapper = await mountView({ activeUrl: null })
    expect(wrapper.text()).toContain("No server connected")
  })

  it("shows 'Unknown content type' for an unknown type", async () => {
    const wrapper = await mountView(
      { activeUrl: "http://example.org/", capabilities: { schemes: cap } },
      "bogus",
    )
    expect(wrapper.text()).toContain("Unknown content type")
  })

  it("shows a not-supported message when the type has no read capability", async () => {
    const wrapper = await mountView({
      activeUrl: "http://example.org/",
      capabilities: { schemes: null },
    })
    expect(wrapper.text()).toContain("does not support browsing")
  })

  it("prompts sign-in when read requires auth and the user is logged out", async () => {
    const wrapper = await mountView({
      activeUrl: "http://example.org/",
      capabilities: { schemes: authCap },
    })
    expect(wrapper.text()).toContain("Sign in to browse")
    expect(wrapper.find(".stub-list").exists()).toBe(false)
  })

  it("shows a not-authorized message when logged in without read access", async () => {
    auth.loggedIn.value = true
    const wrapper = await mountView({
      activeUrl: "http://example.org/",
      capabilities: { schemes: authCap },
    })
    expect(wrapper.text()).toContain("not authorized to browse")
    expect(wrapper.find(".stub-list").exists()).toBe(false)
  })

  it("renders title and list, and the detail once an item is selected", async () => {
    const wrapper = await mountView({
      activeUrl: "http://example.org/",
      capabilities: { schemes: cap },
    })
    expect(wrapper.find("h1").text()).toBe("Terminologies")
    expect(wrapper.find(".stub-list").exists()).toBe(true)
    expect(wrapper.text()).toContain("Select an entry to see its details.")
    expect(wrapper.find(".stub-detail").exists()).toBe(false)

    await wrapper.find(".stub-emit-item").trigger("click")
    await flushPromises()

    expect(wrapper.find(".stub-detail").exists()).toBe(true)
  })

  it("gives mappings a detail pane that shows MappingDetail once selected", async () => {
    const wrapper = await mountView(
      {
        activeUrl: "http://example.org/",
        capabilities: { mappings: cap },
      },
      "mappings",
    )
    expect(wrapper.find("h1").text()).toBe("Mappings")
    expect(wrapper.find(".stub-list").exists()).toBe(true)
    expect(wrapper.find(".stub-detail").exists()).toBe(false)
    expect(wrapper.text()).toContain("Select an entry to see its details.")
    expect(wrapper.find(".jskos-vue-mappingDetail").exists()).toBe(false)

    await wrapper.find(".stub-emit-mapping").trigger("click")

    expect(wrapper.find(".jskos-vue-mappingDetail").exists()).toBe(true)
  })

  it("gives concordances a detail pane that shows ConcordanceDetail once selected", async () => {
    const wrapper = await mountView(
      {
        activeUrl: "http://example.org/",
        capabilities: { concordances: cap },
      },
      "concordances",
    )
    expect(wrapper.find("h1").text()).toBe("Concordances")
    expect(wrapper.find(".stub-list").exists()).toBe(true)
    expect(wrapper.find(".stub-detail").exists()).toBe(false)
    expect(wrapper.text()).toContain("Select an entry to see its details.")
    expect(wrapper.find(".jskos-vue-concordanceDetail").exists()).toBe(false)

    await wrapper.find(".stub-emit-concordance").trigger("click")

    expect(wrapper.find(".jskos-vue-concordanceDetail").exists()).toBe(true)
  })

  it("gives annotations a detail pane that shows AnnotationDetail once selected", async () => {
    const wrapper = await mountView(
      {
        activeUrl: "http://example.org/",
        capabilities: { annotations: cap },
      },
      "annotations",
    )
    expect(wrapper.find("h1").text()).toBe("Annotations")
    expect(wrapper.find(".stub-list").exists()).toBe(true)
    expect(wrapper.find(".stub-detail").exists()).toBe(false)
    expect(wrapper.text()).toContain("Select an entry to see its details.")
    expect(wrapper.find(".jskos-vue-annotationDetail").exists()).toBe(false)

    await wrapper.find(".stub-emit-annotation").trigger("click")

    expect(wrapper.find(".jskos-vue-annotationDetail").exists()).toBe(true)
  })

  it("resolves the narrower placeholder of a deep-linked concept", async () => {
    const child = { uri: "urn:concept:child" }
    const concept = { uri: "urn:concept:parent", narrower: [null] }
    const registry = {
      getConcepts: vi.fn().mockResolvedValue([concept]),
      getNarrower: vi.fn().mockResolvedValue([child]),
    }
    await mountView(
      {
        activeUrl: "http://example.org/",
        capabilities: conceptCap,
        registry,
      },
      "concepts",
      { query: { uri: concept.uri } },
    )
    await flushPromises()

    expect(registry.getNarrower).toHaveBeenCalledWith({ concept })
    expect(concept.narrower).toEqual([child])
  })

  it("does not load narrower when there is no placeholder", async () => {
    const concept = { uri: "urn:concept:leaf", narrower: [] }
    const registry = {
      getConcepts: vi.fn().mockResolvedValue([concept]),
      getNarrower: vi.fn(),
    }
    await mountView(
      {
        activeUrl: "http://example.org/",
        capabilities: conceptCap,
        registry,
      },
      "concepts",
      { query: { uri: concept.uri } },
    )
    await flushPromises()

    expect(registry.getNarrower).not.toHaveBeenCalled()
  })
})
