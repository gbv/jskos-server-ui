import { mount, flushPromises } from "@vue/test-utils"
import { setActivePinia, createPinia } from "pinia"
import { createTestingPinia } from "@pinia/testing"
import { createRouter, createMemoryHistory } from "vue-router"
import OverviewView from "@/views/OverviewView.vue"
import { makeCountResponse } from "../mocks/cdk.js"

vi.mock("@/composables/useCountUp", () => ({
  useCountUp: vi.fn(),
}))

function createStubRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: OverviewView },
      { path: "/terminologies", component: { template: "<div/>" } },
      { path: "/concordances", component: { template: "<div/>" } },
      { path: "/mappings", component: { template: "<div/>" } },
      { path: "/annotations", component: { template: "<div/>" } },
      { path: "/connection", component: { template: "<div/>" } },
    ],
  })
}

function mountView(storeState = {}) {
  return mount(OverviewView, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: { server: storeState },
          stubActions: false,
        }),
        createStubRouter(),
      ],
      stubs: {
        ViewTitle: { template: "<h1><slot /></h1>" },
      },
    },
  })
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const cap = { read: { supported: true, requiresAuth: false } }

describe("OverviewView", () => {
  it("renders 'No server connected' message when not connected", () => {
    expect(mountView({ activeUrl: null }).text()).toContain(
      "No server connected",
    )
  })

  describe("capability-gated card visibility", () => {
    it("shows a card for a capability type that is not null", () => {
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        capabilities: {
          schemes: cap,
          concordances: null,
          mappings: null,
          annotations: null,
        },
      })
      expect(wrapper.findAll(".type-card")).toHaveLength(1)
    })

    it("hides a card for a capability type that is null", () => {
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        capabilities: {
          schemes: null,
          concordances: null,
          mappings: null,
          annotations: null,
        },
      })
      expect(wrapper.findAll(".type-card")).toHaveLength(0)
    })

    it("renders all four cards when all capabilities are set", () => {
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        capabilities: {
          schemes: cap,
          concordances: cap,
          mappings: cap,
          annotations: cap,
        },
      })
      expect(wrapper.findAll(".type-card")).toHaveLength(4)
    })
  })

  describe("count fetching", () => {
    it("shows a spinner while fetching", async () => {
      const reg = { getSchemes: vi.fn(() => new Promise(() => {})) }
      const mreg = {
        getMappings: vi.fn(() => new Promise(() => {})),
        getConcordances: vi.fn(() => new Promise(() => {})),
        getAnnotations: vi.fn(() => new Promise(() => {})),
      }
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        registry: reg,
        mappingsRegistry: mreg,
        capabilities: {
          schemes: cap,
          concordances: cap,
          mappings: cap,
          annotations: cap,
        },
      })
      await wrapper.vm.$nextTick()
      expect(
        wrapper.findAll(".spinner-border, [role='status']").length,
      ).toBeGreaterThan(0)
    })

    it("renders card without spinner after successful fetch", async () => {
      const reg = {
        getSchemes: vi.fn().mockResolvedValue(makeCountResponse(42)),
      }
      const mreg = {
        getMappings: vi.fn().mockResolvedValue(makeCountResponse(0)),
        getConcordances: vi.fn().mockResolvedValue(makeCountResponse(0)),
        getAnnotations: vi.fn().mockResolvedValue(makeCountResponse(0)),
      }
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        registry: reg,
        mappingsRegistry: mreg,
        capabilities: {
          schemes: cap,
          concordances: null,
          mappings: null,
          annotations: null,
        },
      })
      await flushPromises()
      const card = wrapper.find(".type-card")
      expect(card.exists()).toBe(true)
      expect(card.find(".spinner-border").exists()).toBe(false)
    })

    it("shows error indicator when a fetch throws", async () => {
      const reg = {
        getSchemes: vi.fn().mockRejectedValue(new Error("Network error")),
      }
      const mreg = {
        getMappings: vi.fn().mockResolvedValue(makeCountResponse(0)),
        getConcordances: vi.fn().mockResolvedValue(makeCountResponse(0)),
        getAnnotations: vi.fn().mockResolvedValue(makeCountResponse(0)),
      }
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        registry: reg,
        mappingsRegistry: mreg,
        capabilities: {
          schemes: cap,
          concordances: cap,
          mappings: cap,
          annotations: cap,
        },
      })
      await flushPromises()
      const errorEl = wrapper
        .findAll(".count-na")
        .find((el) => el.text() === "✕")
      expect(errorEl).toBeTruthy()
    })

    it("still renders successful cards when only one fetch errors", async () => {
      const reg = { getSchemes: vi.fn().mockRejectedValue(new Error("fail")) }
      const mreg = {
        getMappings: vi.fn().mockResolvedValue(makeCountResponse(100)),
        getConcordances: vi.fn().mockResolvedValue(makeCountResponse(3)),
        getAnnotations: vi.fn().mockResolvedValue(makeCountResponse(0)),
      }
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        registry: reg,
        mappingsRegistry: mreg,
        capabilities: {
          schemes: cap,
          concordances: cap,
          mappings: cap,
          annotations: cap,
        },
      })
      await flushPromises()
      expect(wrapper.findAll(".type-card")).toHaveLength(4)
      expect(
        wrapper.findAll(".count-na").filter((el) => el.text() === "✕"),
      ).toHaveLength(1)
    })

    it("does not call registry methods when registry is null", async () => {
      const mreg = {
        getMappings: vi.fn(),
        getConcordances: vi.fn(),
        getAnnotations: vi.fn(),
      }
      mountView({
        activeUrl: null,
        registry: null,
        mappingsRegistry: mreg,
        capabilities: null,
      })
      await flushPromises()
      expect(mreg.getMappings).not.toHaveBeenCalled()
    })
  })
})
