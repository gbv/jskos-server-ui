import { mount, flushPromises } from "@vue/test-utils"
import { setActivePinia, createPinia } from "pinia"
import { createTestingPinia } from "@pinia/testing"
import { createRouter, createMemoryHistory } from "vue-router"
import OverviewView from "@/views/OverviewView.vue"
import { OBJECT_TYPES } from "@/utils/objectTypes"
import { makeCountResponse } from "../mocks/cdk.js"

vi.mock("@/composables/useCountUp", () => ({
  useCountUp: vi.fn(),
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
  const typeRoutes = Object.values(OBJECT_TYPES)
    .filter((config) => config.route)
    .map((config) => ({
      path: config.route,
      component: { template: "<div/>" },
    }))
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: OverviewView },
      { path: "/connection", component: { template: "<div/>" } },
      ...typeRoutes,
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
  auth.user.value = null
  auth.token.value = null
  auth.loginPublicKey.value = null
  auth.loggedIn.value = false
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const cap = { read: { supported: true, requiresAuth: false } }
const authCap = { read: { supported: true, requiresAuth: true } }

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
          concepts: null,
          concordances: null,
          mappings: null,
          annotations: null,
          registries: null,
          occurrences: null,
        },
      })
      expect(wrapper.findAll(".type-card")).toHaveLength(1)
    })

    it("hides a card for a capability type that is null", () => {
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        capabilities: {
          schemes: null,
          concepts: null,
          concordances: null,
          mappings: null,
          annotations: null,
          registries: null,
          occurrences: null,
        },
      })
      expect(wrapper.findAll(".type-card")).toHaveLength(0)
    })

    it("renders all five cards when all capabilities are set", () => {
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        capabilities: {
          schemes: cap,
          concepts: cap,
          concordances: cap,
          mappings: cap,
          annotations: cap,
          registries: cap,
        },
      })
      expect(wrapper.findAll(".type-card")).toHaveLength(6)
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
      const reg = {
        getSchemes: vi.fn().mockRejectedValue(new Error("fail")),
        getRegistries: vi.fn().mockResolvedValue(makeCountResponse(2)),
      }
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
          concepts: cap,
          concordances: cap,
          mappings: cap,
          annotations: cap,
          registries: cap,
        },
      })
      await flushPromises()
      expect(wrapper.findAll(".type-card")).toHaveLength(6)
      expect(
        wrapper.findAll(".count-na").filter((el) => el.text() === "✕"),
      ).toHaveLength(2)
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

  describe("read authorization", () => {
    const lockedCaps = {
      schemes: authCap,
      concepts: null,
      concordances: null,
      mappings: null,
      annotations: null,
      registries: null,
    }

    it("shows a yellow lock and no link when read requires auth and logged out", async () => {
      const reg = {
        getSchemes: vi.fn().mockResolvedValue(makeCountResponse(5)),
        isAuthorizedFor: () => auth.loggedIn.value,
      }
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        registry: reg,
        capabilities: lockedCaps,
      })
      await flushPromises()

      const card = wrapper.find(".type-card")
      expect(card.classes()).toContain("type-card-locked")
      expect(card.element.tagName).toBe("DIV")
      expect(card.find(".text-warning").exists()).toBe(true)
      expect(reg.getSchemes).not.toHaveBeenCalled()
    })

    it("shows a red lock when logged in but not authorized", async () => {
      auth.loggedIn.value = true
      const reg = {
        getSchemes: vi.fn().mockResolvedValue(makeCountResponse(5)),
        isAuthorizedFor: () => false,
      }
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        registry: reg,
        capabilities: lockedCaps,
      })
      await flushPromises()

      const card = wrapper.find(".type-card")
      expect(card.classes()).toContain("type-card-locked")
      expect(card.find(".text-danger").exists()).toBe(true)
      expect(reg.getSchemes).not.toHaveBeenCalled()
    })

    it("fetches the count once the user signs in and gains access", async () => {
      const reg = {
        getSchemes: vi.fn().mockResolvedValue(makeCountResponse(5)),
        isAuthorizedFor: () => auth.loggedIn.value,
      }
      const wrapper = mountView({
        activeUrl: "http://example.org/",
        registry: reg,
        capabilities: lockedCaps,
      })
      await flushPromises()
      expect(reg.getSchemes).not.toHaveBeenCalled()

      auth.loggedIn.value = true
      await flushPromises()

      expect(reg.getSchemes).toHaveBeenCalledWith({ limit: 0 })
      const card = wrapper.find(".type-card")
      expect(card.element.tagName).toBe("A")
      expect(card.classes()).not.toContain("type-card-locked")
    })
  })
})
