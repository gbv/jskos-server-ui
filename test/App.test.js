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

    expect(window.location.search).toEqual(
      "?endpoint=http%3A%2F%2Fcached.org%2F",
    )
  })

  it("auto-connects with default service when no activeUrl", async () => {
    window.location.search = ""
    mockFetchSuccess({
      services: [
        {
          endpoint: "http://default.org/",
          api: "http://bartoc.org/api-type/jskos",
        },
      ],
    })
    const { cdk } = await import("cocoda-sdk")
    const { makeRegistry } = await import("./mocks/cdk.js")
    cdk.initializeRegistry.mockReturnValue(makeRegistry())

    mountApp({ server: { activeUrl: null } })
    await flushPromises()

    expect(cdk.initializeRegistry).toHaveBeenCalledWith(
      expect.objectContaining({ api: "http://default.org/" }),
    )
  })

  it("does not connect when no query parameter, activeUrl, or default service is set", async () => {
    const { cdk } = await import("cocoda-sdk")
    window.location.search = ""
    mountApp({ server: { activeUrl: null } })
    await flushPromises()
    expect(cdk.initializeRegistry).not.toHaveBeenCalled()
  })

  it("gets endpoint from query parameter first", async () => {
    const { cdk } = await import("cocoda-sdk")
    window.location.search = "endpoint=http://example.com/"
    mountApp({ server: { activeUrl: "http://default.org/" } })
    await flushPromises()
    expect(cdk.initializeRegistry).toHaveBeenCalledWith(
      expect.objectContaining({ api: "http://example.com/" }),
    )
  })
})
