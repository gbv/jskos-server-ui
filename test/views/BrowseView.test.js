import { mount } from "@vue/test-utils"
import { setActivePinia, createPinia } from "pinia"
import { createTestingPinia } from "@pinia/testing"
import { createRouter, createMemoryHistory } from "vue-router"
import BrowseView from "@/views/BrowseView.vue"

vi.mock("@/composables/useNotify", () => ({
  useNotify: () => ({ notify: vi.fn() }),
}))

function createStubRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/terminologies", component: BrowseView },
      { path: "/connection", component: { template: "<div/>" } },
    ],
  })
}

async function mountView(storeState = {}, type = "schemes") {
  const router = createStubRouter()
  router.push("/terminologies")
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
        BrowseList: { template: "<div class='stub-list'/>" },
        BrowseDetail: { template: "<div class='stub-detail'/>" },
      },
    },
  })
}

const cap = { read: { supported: true, requiresAuth: false } }

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.clearAllMocks()
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

  it("renders title, list and detail when supported", async () => {
    const wrapper = await mountView({
      activeUrl: "http://example.org/",
      capabilities: { schemes: cap },
    })
    expect(wrapper.find("h1").text()).toBe("Terminologies")
    expect(wrapper.find(".stub-list").exists()).toBe(true)
    expect(wrapper.find(".stub-detail").exists()).toBe(true)
  })
})
