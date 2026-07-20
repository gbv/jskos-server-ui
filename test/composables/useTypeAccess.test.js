import { setActivePinia, createPinia } from "pinia"
import { useServerStore } from "@/stores/server"
import { useTypeAccess } from "@/composables/useTypeAccess"

const auth = vi.hoisted(() => ({}))

vi.mock("@/composables/useAuth", async () => {
  const { ref } = await import("vue")
  auth.user = ref(null)
  auth.token = ref(null)
  auth.loginPublicKey = ref(null)
  auth.loggedIn = ref(false)
  return { useAuth: () => auth }
})

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.clearAllMocks()
  auth.user.value = null
  auth.token.value = null
  auth.loginPublicKey.value = null
  auth.loggedIn.value = false
})

describe("useTypeAccess", () => {
  it("resolves unsupported when the server has no capability for the action", () => {
    const store = useServerStore()
    store.capabilities = {
      mappings: { read: { supported: true, requiresAuth: false } },
    }
    const { resolveAccess } = useTypeAccess()

    expect(resolveAccess("mappings", "delete")).toBe("unsupported")
  })

  it("resolves open when the action does not require auth", () => {
    const store = useServerStore()
    store.capabilities = {
      mappings: { delete: { supported: true, requiresAuth: false } },
    }
    const { resolveAccess } = useTypeAccess()

    expect(resolveAccess("mappings", "delete")).toBe("open")
  })

  it("resolves open when auth is required and the user is authorized", () => {
    const store = useServerStore()
    store.capabilities = {
      mappings: { delete: { supported: true, requiresAuth: true } },
    }
    store.mappingsRegistry = { isAuthorizedFor: vi.fn(() => true) }
    auth.loggedIn.value = true
    const { resolveAccess } = useTypeAccess()

    expect(resolveAccess("mappings", "delete")).toBe("open")
  })

  it("resolves auth-required when auth is required and the user is logged out", () => {
    const store = useServerStore()
    store.capabilities = {
      mappings: { delete: { supported: true, requiresAuth: true } },
    }
    store.mappingsRegistry = { isAuthorizedFor: vi.fn(() => false) }
    const { resolveAccess } = useTypeAccess()

    expect(resolveAccess("mappings", "delete")).toBe("auth-required")
  })

  it("resolves denied when the user is logged in but not authorized", () => {
    const store = useServerStore()
    store.capabilities = {
      mappings: { delete: { supported: true, requiresAuth: true } },
    }
    store.mappingsRegistry = { isAuthorizedFor: vi.fn(() => false) }
    auth.loggedIn.value = true
    const { resolveAccess } = useTypeAccess()

    expect(resolveAccess("mappings", "delete")).toBe("denied")
  })

  it("defaults to the read action", () => {
    const store = useServerStore()
    store.capabilities = {
      mappings: { read: { supported: true, requiresAuth: false } },
    }
    const { resolveAccess } = useTypeAccess()

    expect(resolveAccess("mappings")).toBe("open")
  })
})
