import { setActivePinia, createPinia } from "pinia"
import { useServerStore } from "@/stores/server"
import { makeRegistry } from "../mocks/cdk.js"

vi.mock("cocoda-sdk", () => ({
  cdk: { initializeRegistry: vi.fn() },
}))

vi.mock("@/utils/capabilities", () => ({
  parseCapabilities: vi.fn(() => ({
    schemes: { read: { supported: true, requiresAuth: false } },
    concepts: null,
    mappings: {
      read: { supported: true, requiresAuth: false },
      create: { supported: true, requiresAuth: true },
    },
    concordances: { read: { supported: true, requiresAuth: false } },
    annotations: { read: { supported: true, requiresAuth: false } },
    registries: null,
  })),
}))

const LS_URL_KEY = "jskos-server-ui:activeUrl"
const LS_SERVERS_KEY = "jskos-server-ui:servers"

async function setup() {
  const { cdk } = await import("cocoda-sdk")
  const reg = makeRegistry()
  const mreg = makeRegistry()
  cdk.initializeRegistry.mockReturnValueOnce(reg).mockReturnValueOnce(mreg)
  return { cdk, reg, mreg }
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useServerStore", () => {
  describe("localStorage hydration", () => {
    it("reads activeUrl from localStorage on store creation", () => {
      localStorage.setItem(LS_URL_KEY, "http://example.org/")
      const store = useServerStore()
      expect(store.activeUrl).toBe("http://example.org/")
    })

    it("reads servers list from localStorage on store creation", () => {
      localStorage.setItem(
        LS_SERVERS_KEY,
        JSON.stringify(["http://a.org/", "http://b.org/"]),
      )
      const store = useServerStore()
      expect(store.servers).toEqual(["http://a.org/", "http://b.org/"])
    })
  })

  describe("connectToServer(url)", () => {
    it("sets activeUrl, status, and capabilities after successful connection", async () => {
      const { reg } = await setup()
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      expect(store.activeUrl).toBe("http://example.org/")
      expect(store.status).toStrictEqual(reg._config)
      expect(store.capabilities).toBeDefined()
    })

    it("persists activeUrl and servers to localStorage", async () => {
      await setup()
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      expect(localStorage.getItem(LS_URL_KEY)).toBe("http://example.org/")
      expect(JSON.parse(localStorage.getItem(LS_SERVERS_KEY))).toContain(
        "http://example.org/",
      )
    })

    it("does not duplicate a URL already in servers", async () => {
      localStorage.setItem(
        LS_SERVERS_KEY,
        JSON.stringify(["http://example.org/"]),
      )
      await setup()
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      expect(
        store.servers.filter((u) => u === "http://example.org/"),
      ).toHaveLength(1)
    })

    it("clears error after a successful reconnect", async () => {
      const { cdk } = await import("cocoda-sdk")
      cdk.initializeRegistry.mockReturnValueOnce(makeRegistry({ _config: {} }))
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      expect(store.error).toBeTruthy()

      const reg = makeRegistry()
      const mreg = makeRegistry()
      cdk.initializeRegistry.mockReturnValueOnce(reg).mockReturnValueOnce(mreg)
      await store.connectToServer("http://example.org/")
      expect(store.error).toBeNull()
    })

    it("sets error and leaves activeUrl null when _config is empty after init", async () => {
      const { cdk } = await import("cocoda-sdk")
      cdk.initializeRegistry.mockReturnValueOnce(makeRegistry({ _config: {} }))
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      expect(store.error).toBeTruthy()
      expect(store.activeUrl).toBeNull()
      expect(localStorage.getItem(LS_URL_KEY)).toBeNull()
    })

    it("sets error from thrown Error.message", async () => {
      const { cdk } = await import("cocoda-sdk")
      const reg = makeRegistry()
      reg.init.mockRejectedValueOnce(new Error("Connection refused"))
      cdk.initializeRegistry.mockReturnValueOnce(reg)
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      expect(store.error).toBe("Connection refused")
    })
  })

  describe("disconnectServer()", () => {
    it("resets all state to null and removes activeUrl from localStorage", async () => {
      await setup()
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      store.disconnectServer()
      expect(store.registry).toBeNull()
      expect(store.status).toBeNull()
      expect(store.capabilities).toBeNull()
      expect(store.activeUrl).toBeNull()
      expect(localStorage.getItem(LS_URL_KEY)).toBeNull()
    })

    it("preserves servers history after disconnect", async () => {
      await setup()
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      store.disconnectServer()
      expect(localStorage.getItem(LS_SERVERS_KEY)).not.toBeNull()
    })
  })

  describe("removeServer(url)", () => {
    it("removes URL from list and persists", () => {
      localStorage.setItem(
        LS_SERVERS_KEY,
        JSON.stringify(["http://a.org/", "http://b.org/"]),
      )
      const store = useServerStore()
      store.removeServer("http://a.org/")
      expect(store.servers).not.toContain("http://a.org/")
      expect(JSON.parse(localStorage.getItem(LS_SERVERS_KEY))).not.toContain(
        "http://a.org/",
      )
    })

    it("disconnects when the active URL is removed", async () => {
      await setup()
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      store.removeServer("http://example.org/")
      expect(store.activeUrl).toBeNull()
      expect(store.registry).toBeNull()
    })
  })

  describe("canDo(type, action)", () => {
    it("returns true when the capability entry is non-null", async () => {
      await setup()
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      expect(store.canDo("schemes", "read")).toBe(true)
    })

    it("returns false when capabilities is null", () => {
      expect(useServerStore().canDo("schemes", "read")).toBe(false)
    })

    it("returns false when the type entry is null", async () => {
      await setup()
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      expect(store.canDo("concepts", "read")).toBe(false)
    })

    it("returns false when the action entry is null", async () => {
      const { parseCapabilities } = await import("@/utils/capabilities")
      parseCapabilities.mockReturnValueOnce({
        schemes: { read: null },
        concepts: null,
        mappings: null,
        concordances: null,
        annotations: null,
        registries: null,
      })
      const { cdk } = await import("cocoda-sdk")
      cdk.initializeRegistry
        .mockReturnValueOnce(makeRegistry())
        .mockReturnValueOnce(makeRegistry())
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      expect(store.canDo("schemes", "read")).toBe(false)
    })
  })

  describe("requiresAuth(type, action)", () => {
    it("returns true when requiresAuth: true", async () => {
      await setup()
      const store = useServerStore()
      await store.connectToServer("http://example.org/")
      expect(store.requiresAuth("mappings", "create")).toBe(true)
    })

    it("returns false when capabilities is null", () => {
      expect(useServerStore().requiresAuth("schemes", "read")).toBe(false)
    })
  })
})
