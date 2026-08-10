import { mount } from "@vue/test-utils"
import { createBootstrap } from "bootstrap-vue-next"
import AccountMenu from "@/components/AccountMenu.vue"

class NoInternetConnectionError extends Error {}
class ThirdPartyCookiesBlockedError extends Error {}
class ServerConnectionError extends Error {}

// Builds a mock of the `login` object injected by the gbv-login-client-vue plugin.
function createLoginMock(overrides = {}) {
  return {
    connected: true,
    loggedIn: false,
    user: null,
    providers: [],
    lastError: null,
    errors: {
      NoInternetConnectionError,
      ThirdPartyCookiesBlockedError,
      ServerConnectionError,
    },
    openLoginWindow: vi.fn(),
    openLogoutWindow: vi.fn(),
    openBaseWindow: vi.fn(),
    ...overrides,
  }
}

function mountMenu(login, props = {}) {
  return mount(AccountMenu, {
    props,
    global: {
      plugins: [createBootstrap()],
      provide: { login },
    },
  })
}

describe("AccountMenu", () => {
  it("shows a sign-in nav link when connected but signed out", async () => {
    const login = createLoginMock()
    const wrapper = mountMenu(login)
    const link = wrapper.find(".account-menu-signin a")

    expect(link.exists()).toBe(true)
    expect(link.classes()).not.toContain("disabled")
    expect(link.text()).toContain("Sign in")

    await link.trigger("click")
    expect(login.openLoginWindow).toHaveBeenCalledWith({ redirect: true })
  })

  it("passes redirect=false through to openLoginWindow", async () => {
    const login = createLoginMock()
    const wrapper = mountMenu(login, { redirect: false })

    await wrapper.find(".account-menu-signin a").trigger("click")
    expect(login.openLoginWindow).toHaveBeenCalledWith({ redirect: false })
  })

  it("shows the user name and a sign-out action when signed in", async () => {
    const login = createLoginMock({
      loggedIn: true,
      user: { name: "Ada Lovelace", uri: "urn:user:ada", identities: {} },
    })
    const wrapper = mountMenu(login)

    expect(wrapper.find(".account-menu-signin").exists()).toBe(false)
    expect(wrapper.find(".account-menu-name").text()).toBe("Ada Lovelace")

    // Icon-only trigger: no dropdown caret is shown.
    expect(wrapper.find(".account-menu-toggle").classes()).toContain(
      "dropdown-toggle-no-caret",
    )

    const signOut = wrapper
      .findAll("a, button")
      .find((element) => element.text().includes("Sign out"))
    expect(signOut).toBeDefined()

    await signOut.trigger("click")
    // Sign-out always uses a popup so the user stays in the app.
    expect(login.openLogoutWindow).toHaveBeenCalledWith({ redirect: false })
  })

  it("renders a flat panel without a dropdown when inline and signed in", async () => {
    const login = createLoginMock({
      loggedIn: true,
      user: { name: "Ada Lovelace", uri: "urn:user:ada", identities: {} },
    })
    const wrapper = mountMenu(login, { inline: true })

    // No dropdown toggle: the panel is shown flat inside the offcanvas.
    expect(wrapper.find(".account-menu-inline").exists()).toBe(true)
    expect(wrapper.find(".account-menu-toggle").exists()).toBe(false)
    expect(wrapper.find(".account-menu-name").text()).toBe("Ada Lovelace")

    const signOut = wrapper
      .findAll("button")
      .find((element) => element.text().includes("Sign out"))
    expect(signOut).toBeDefined()

    await signOut.trigger("click")
    expect(login.openLogoutWindow).toHaveBeenCalledWith({ redirect: false })
  })

  it("shows which provider the user signed in with", () => {
    const login = createLoginMock({
      loggedIn: true,
      user: {
        name: "Ada Lovelace",
        uri: "https://login.example/users/ada",
        identities: {
          orcid: { uri: "https://orcid.org/0000-0002-1825-0097", name: "Ada" },
        },
      },
      providers: [{ id: "orcid", name: "ORCID" }],
    })
    const wrapper = mountMenu(login)
    const identity = wrapper.find(".account-menu-identity")

    expect(identity.text()).toBe("Signed in via ORCID")
    // No provider logo (blocked by CORP) and no identity id are shown.
    expect(identity.find("img").exists()).toBe(false)
    expect(wrapper.find(".account-menu-identity-id").exists()).toBe(false)
  })

  it("falls back to the provider id when the provider is unknown", () => {
    const login = createLoginMock({
      loggedIn: true,
      user: {
        name: "Grace Hopper",
        uri: "https://login.example/users/grace",
        identities: { github: { uri: "https://github.com/grace" } },
      },
      providers: [],
    })
    const wrapper = mountMenu(login)

    expect(wrapper.find(".account-menu-identity").text()).toContain(
      "Signed in via github",
    )
  })

  it("opens the login server page from the manage-account item", async () => {
    const login = createLoginMock({
      loggedIn: true,
      user: { name: "Ada", uri: "urn:user:ada", identities: {} },
    })
    const wrapper = mountMenu(login)
    const manage = wrapper
      .findAll("a, button")
      .find((element) => element.text().includes("Manage account"))

    expect(manage).toBeDefined()
    await manage.trigger("click")
    expect(login.openBaseWindow).toHaveBeenCalled()
  })

  it("disables the sign-in link while not connected", () => {
    const wrapper = mountMenu(createLoginMock({ connected: false }))
    const link = wrapper.find(".account-menu-signin a")

    expect(link.exists()).toBe(true)
    expect(link.classes()).toContain("disabled")
  })

  it("shows an error hint on the disabled link when the connection failed", () => {
    const wrapper = mountMenu(
      createLoginMock({
        connected: false,
        lastError: new ServerConnectionError(),
      }),
    )

    expect(wrapper.find(".account-menu-signin a").classes()).toContain(
      "disabled",
    )
    const tooltipTexts = [
      ...document.body.querySelectorAll(".tooltip-inner"),
    ].map((element) => element.textContent)
    expect(tooltipTexts).toContain("The login server is currently unreachable.")
  })
})
