import { mount, flushPromises } from "@vue/test-utils"
import { createTestingPinia } from "@pinia/testing"
import { createBootstrap } from "bootstrap-vue-next"
import { createRouter, createMemoryHistory } from "vue-router"
import App from "@/App.vue"
import { mockMatchMedia, mockFetchSuccess } from "./helpers.js"

vi.mock("cocoda-sdk", () => ({
  cdk: { initializeRegistry: vi.fn() },
}))

vi.mock("@/utils/capabilities", () => ({
  parseCapabilities: vi.fn(() => ({})),
}))

function createStubRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { template: "<div/>" } }],
  })
}

function mountApp(initialState = {}) {
  return mount(App, {
    global: {
      plugins: [
        createBootstrap(),
        createTestingPinia({ initialState, stubActions: false }),
        createStubRouter(),
      ],
      stubs: {
        AppNavbar: { template: "<nav />" },
        AppFooter: { template: "<footer />" },
        BApp: { template: "<div><slot /></div>" },
      },
    },
  })
}

beforeEach(() => {
  localStorage.clear()
  mockMatchMedia(false)
  mockFetchSuccess({})
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("App.vue — startup sequence", () => {
  it("calls loadConfig on mount (fetches config.json)", async () => {
    mountApp()
    await flushPromises()
    expect(fetch).toHaveBeenCalledWith("config.json")
  })

  it("auto-connects with activeUrl from localStorage", async () => {
    localStorage.setItem("jskos-server-ui:activeUrl", "http://cached.org/")
    const { cdk } = await import("cocoda-sdk")
    const { makeRegistry } = await import("./mocks/cdk.js")
    cdk.initializeRegistry.mockReturnValue(makeRegistry())

    mountApp({
      server: {
        activeUrl: "http://cached.org/",
        servers: ["http://cached.org/"],
      },
    })
    await flushPromises()

    expect(cdk.initializeRegistry).toHaveBeenCalledWith(
      expect.objectContaining({ api: "http://cached.org/" }),
    )
  })

  it("auto-connects with defaultServer when no activeUrl", async () => {
    mockFetchSuccess({ defaultServer: "http://default.org/" })
    const { cdk } = await import("cocoda-sdk")
    const { makeRegistry } = await import("./mocks/cdk.js")
    cdk.initializeRegistry.mockReturnValue(makeRegistry())

    mountApp({ server: { activeUrl: null } })
    await flushPromises()

    expect(cdk.initializeRegistry).toHaveBeenCalledWith(
      expect.objectContaining({ api: "http://default.org/" }),
    )
  })

  it("does not connect when neither activeUrl nor defaultServer is set", async () => {
    const { cdk } = await import("cocoda-sdk")
    mountApp({ server: { activeUrl: null } })
    await flushPromises()
    expect(cdk.initializeRegistry).not.toHaveBeenCalled()
  })
})
