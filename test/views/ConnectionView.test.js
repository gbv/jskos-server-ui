import { mount, flushPromises } from "@vue/test-utils"
import { setActivePinia, createPinia } from "pinia"
import { createTestingPinia } from "@pinia/testing"
import { createRouter, createMemoryHistory } from "vue-router"
import ConnectionView from "@/views/ConnectionView.vue"
import { useServerStore } from "@/stores/server"
import { makeRegistry } from "../mocks/cdk.js"

vi.mock("cocoda-sdk", () => ({
  cdk: { initializeRegistry: vi.fn() },
}))

vi.mock("@/utils/capabilities", () => ({
  parseCapabilities: vi.fn(() => ({
    schemes: {
      read: { supported: true, requiresAuth: false },
      create: { supported: true, requiresAuth: true },
      update: null,
      delete: null,
    },
    concepts: null,
    mappings: {
      read: { supported: true, requiresAuth: false },
      create: { supported: true, requiresAuth: true },
      update: null,
      delete: null,
    },
    concordances: {
      read: { supported: true, requiresAuth: false },
      create: null,
      update: null,
      delete: null,
    },
    annotations: {
      read: { supported: true, requiresAuth: false },
      create: null,
      update: null,
      delete: null,
    },
    registries: null,
  })),
}))

const mockToastCreate = vi.fn()

vi.mock("bootstrap-vue-next", async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    useToast: () => ({ create: mockToastCreate }),
  }
})

function createStubRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div/>" } },
      { path: "/connection", component: ConnectionView },
    ],
  })
}

function mountView(storeState = {}) {
  return mount(ConnectionView, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: { server: storeState },
          stubActions: false,
        }),
        createStubRouter(),
      ],
      stubs: {
        RemoveIcon: {
          template:
            '<button class="remove-icon-stub" @click="$emit(\'click\')" />',
        },
        ViewTitle: { template: "<h1><slot /></h1>" },
        BIconCheckCircleFill: { template: "<span class='icon-check' />" },
        BIconLockFill: { template: "<span class='icon-lock' />" },
        BIconDashCircle: { template: "<span class='icon-dash' />" },
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

describe("ConnectionView", () => {
  describe("disconnected state", () => {
    it("renders the URL input field", () => {
      expect(mountView().find("input[type='url']").exists()).toBe(true)
    })

    it("Connect button is disabled when input is empty, enabled when filled", async () => {
      const wrapper = mountView()
      const connectBtn = () =>
        wrapper.findAll("button").find((b) => b.text().includes("Connect"))
      expect(connectBtn().attributes("disabled")).toBeDefined()
      await wrapper.find("input[type='url']").setValue("http://example.org/")
      expect(connectBtn().attributes("disabled")).toBeUndefined()
    })

    it("calls store.connectToServer with trimmed URL on Connect click", async () => {
      const { cdk } = await import("cocoda-sdk")
      cdk.initializeRegistry
        .mockReturnValueOnce(makeRegistry())
        .mockReturnValueOnce(makeRegistry())

      const wrapper = mountView()
      const store = useServerStore()
      vi.spyOn(store, "connectToServer")

      await wrapper
        .find("input[type='url']")
        .setValue("  http://example.org/  ")
      await wrapper
        .findAll("button")
        .find((b) => b.text().includes("Connect"))
        .trigger("click")
      await flushPromises()

      expect(store.connectToServer).toHaveBeenCalledWith("http://example.org/")
    })

    it("shows store.error in an alert", () => {
      expect(mountView({ error: "Connection refused" }).text()).toContain(
        "Connection refused",
      )
    })

    it("renders a list item per URL in store.servers", () => {
      const wrapper = mountView({ servers: ["http://a.org/", "http://b.org/"] })
      expect(wrapper.findAll(".list-group-item")).toHaveLength(2)
    })

    it("clicking a history URL calls store.connectToServer", async () => {
      const { cdk } = await import("cocoda-sdk")
      cdk.initializeRegistry
        .mockReturnValueOnce(makeRegistry())
        .mockReturnValueOnce(makeRegistry())

      const wrapper = mountView({ servers: ["http://a.org/"] })
      const store = useServerStore()
      vi.spyOn(store, "connectToServer")

      await wrapper.find(".list-group-item button.btn-link").trigger("click")
      await flushPromises()

      expect(store.connectToServer).toHaveBeenCalledWith("http://a.org/")
    })

    it("clicking RemoveIcon calls store.removeServer", async () => {
      const wrapper = mountView({ servers: ["http://a.org/"] })
      const store = useServerStore()
      vi.spyOn(store, "removeServer")
      await wrapper.find(".remove-icon-stub").trigger("click")
      expect(store.removeServer).toHaveBeenCalledWith("http://a.org/")
    })

    it("shows success toast after successful connection", async () => {
      const { cdk } = await import("cocoda-sdk")
      cdk.initializeRegistry
        .mockReturnValueOnce(makeRegistry())
        .mockReturnValueOnce(makeRegistry())

      const wrapper = mountView()
      await wrapper.find("input[type='url']").setValue("http://example.org/")
      await wrapper
        .findAll("button")
        .find((b) => b.text().includes("Connect"))
        .trigger("click")
      await flushPromises()

      expect(mockToastCreate).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "success" }),
      )
    })

    it("shows danger toast after failed connection", async () => {
      const { cdk } = await import("cocoda-sdk")
      cdk.initializeRegistry.mockReturnValueOnce(makeRegistry({ _config: {} }))

      const wrapper = mountView()
      await wrapper.find("input[type='url']").setValue("http://bad.org/")
      await wrapper
        .findAll("button")
        .find((b) => b.text().includes("Connect"))
        .trigger("click")
      await flushPromises()

      expect(mockToastCreate).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "danger" }),
      )
    })
  })

  describe("connected state", () => {
    const connectedState = {
      activeUrl: "http://example.org/",
      service: {
        prefLabel: { en: "My Server" },
        API_VERSION: "1.0",
        version: "2.5",
        api: "http://bartoc.org/api-type/jskos",
        endpoint: "http://example.org/",
        ENV: "production",
        AUTH: true,
      },
      CAPABILITIES: {
        schemes: {
          read: { supported: true, requiresAuth: false },
          create: { supported: true, requiresAuth: true },
          update: null,
          delete: null,
        },
        concepts: null,
        mappings: {
          read: { supported: true, requiresAuth: false },
          create: null,
          update: null,
          delete: null,
        },
        concordances: null,
        annotations: null,
        registries: null,
      },
    }

    it("hides the form and shows server info card", () => {
      const wrapper = mountView(connectedState)
      expect(wrapper.find("input[type='url']").exists()).toBe(false)
      expect(wrapper.text()).toContain("My Server")
    })

    it("shows capability matrix with check, lock, and dash icons", () => {
      const wrapper = mountView(connectedState)
      expect(wrapper.findAll(".icon-check").length).toBeGreaterThan(0)
      expect(wrapper.findAll(".icon-lock").length).toBeGreaterThan(0)
      expect(wrapper.findAll(".icon-dash").length).toBeGreaterThan(0)
    })

  })
})
