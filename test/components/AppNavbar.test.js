import { mount } from "@vue/test-utils"
import { setActivePinia, createPinia } from "pinia"
import { createTestingPinia } from "@pinia/testing"
import { createRouter, createMemoryHistory } from "vue-router"
import { createBootstrap } from "bootstrap-vue-next"
import AppNavbar from "@/components/AppNavbar.vue"

function createStubRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "overview", component: { template: "<div/>" } },
      {
        path: "/connection",
        name: "connection",
        component: { template: "<div/>" },
      },
    ],
  })
}

function mountNavbar(storeState = {}) {
  return mount(AppNavbar, {
    global: {
      plugins: [
        createBootstrap(),
        createTestingPinia({
          initialState: { server: storeState },
          stubActions: false,
        }),
        createStubRouter(),
      ],
      stubs: {
        ThemeToggle: { template: "<div class='theme-toggle-stub' />" },
      },
    },
  })
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe("AppNavbar", () => {
  it("renders the brand as a router-link to the overview route", () => {
    const wrapper = mountNavbar()
    const brand = wrapper.find(".navbar-brand")
    expect(brand.exists()).toBe(true)
    expect(brand.attributes("href")).toBe("/")
  })

  it("shows the app name fallback when no server is connected", () => {
    expect(mountNavbar().find(".navbar-brand").text()).toContain(
      "JSKOS Server UI",
    )
  })

  it("shows the connected server title in the brand", () => {
    const wrapper = mountNavbar({
      activeUrl: "http://example.org/",
      service: {
        prefLabel: { en: "My Server" },
        endpoint: "http://example.org/",
      },
    })
    expect(wrapper.find(".navbar-brand").text()).toContain("My Server")
  })

  it("does not render a Disconnect button", () => {
    const wrapper = mountNavbar({
      activeUrl: "http://example.org/",
      service: {
        prefLabel: { en: "My Server" },
        endpoint: "http://example.org/",
      },
    })
    const disconnectButton = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Disconnect"))
    expect(disconnectButton).toBeUndefined()
  })
})
