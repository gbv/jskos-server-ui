import { useAuth } from "@/composables/useAuth"

const mock = vi.hoisted(() => ({}))

vi.mock("gbv-login-client-vue/login", async () => {
  const { ref } = await import("vue")
  mock.user = ref(null)
  mock.token = ref(null)
  mock.loggedIn = ref(false)
  mock.about = ref(null)
  return {
    user: mock.user,
    token: mock.token,
    loggedIn: mock.loggedIn,
    about: mock.about,
  }
})

beforeEach(() => {
  mock.user.value = null
  mock.token.value = null
  mock.loggedIn.value = false
  mock.about.value = null
})

describe("useAuth", () => {
  it("re-exposes the login client primitives", () => {
    mock.user.value = { uri: "urn:user:ada" }
    mock.token.value = "jwt"
    mock.loggedIn.value = true

    const { user, token, loggedIn } = useAuth()
    expect(user.value).toEqual({ uri: "urn:user:ada" })
    expect(token.value).toBe("jwt")
    expect(loggedIn.value).toBe(true)
  })

  it("derives loginPublicKey from about.publicKey", () => {
    mock.about.value = { publicKey: "PUBLIC_KEY" }
    expect(useAuth().loginPublicKey.value).toBe("PUBLIC_KEY")
  })

  it("returns null loginPublicKey when about is not loaded", () => {
    expect(useAuth().loginPublicKey.value).toBeNull()
  })
})
