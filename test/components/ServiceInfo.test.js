import { mount } from "@vue/test-utils"
import { createBootstrap } from "bootstrap-vue-next"
import IconCheckCircleFill from "~icons/bi/check-circle-fill"
import IconLockFill from "~icons/bi/lock-fill"
import IconUnlockFill from "~icons/bi/unlock-fill"
import IconDashCircle from "~icons/bi/dash-circle"
import ServiceInfo from "@/components/ServiceInfo.vue"

function makeInfo(capabilities) {
  return {
    prefLabel: { en: "Test Server" },
    endpoint: "http://example.org/",
    api: "http://bartoc.org/api-type/jskos",
    API_VERSION: "1",
    version: "2",
    ENV: "test",
    AUTH: true,
    CAPABILITIES: capabilities,
  }
}

function mountInfo(props) {
  return mount(ServiceInfo, {
    props,
    global: { plugins: [createBootstrap()] },
  })
}

// A single auth-required cell (schemes/create) plus one open cell (schemes/read).
const capabilities = {
  schemes: {
    read: { supported: true, requiresAuth: false },
    create: { supported: true, requiresAuth: true },
  },
  concepts: null,
  mappings: null,
  concordances: null,
  annotations: null,
  registries: null,
  types: null,
  occurrences: null,
}

describe("ServiceInfo capability matrix", () => {
  it("shows a warning lock for auth-required cells when signed out", () => {
    const wrapper = mountInfo({
      info: makeInfo(capabilities),
      isLoggedIn: false,
    })
    const body = wrapper.get("tbody")
    const locks = body.findAllComponents(IconLockFill)
    expect(locks).toHaveLength(1)
    expect(locks[0].classes()).toContain("text-warning")
    expect(body.findAllComponents(IconUnlockFill)).toHaveLength(0)
  })

  it("shows a success unlock when signed in and authorized", () => {
    const wrapper = mountInfo({
      info: makeInfo(capabilities),
      authorization: { schemes: { create: true } },
      isLoggedIn: true,
    })
    const body = wrapper.get("tbody")
    const unlocks = body.findAllComponents(IconUnlockFill)
    expect(unlocks).toHaveLength(1)
    expect(unlocks[0].classes()).toContain("text-success")
    expect(body.findAllComponents(IconLockFill)).toHaveLength(0)
  })

  it("shows a danger lock when signed in and not authorized", () => {
    const wrapper = mountInfo({
      info: makeInfo(capabilities),
      authorization: { schemes: { create: false } },
      isLoggedIn: true,
    })
    const body = wrapper.get("tbody")
    const locks = body.findAllComponents(IconLockFill)
    expect(locks).toHaveLength(1)
    expect(locks[0].classes()).toContain("text-danger")
    expect(body.findAllComponents(IconUnlockFill)).toHaveLength(0)
  })

  it("leaves open and unsupported cells unchanged when signed in", () => {
    const wrapper = mountInfo({
      info: makeInfo(capabilities),
      authorization: { schemes: { create: true } },
      isLoggedIn: true,
    })
    const body = wrapper.get("tbody")
    expect(body.findAllComponents(IconCheckCircleFill).length).toBeGreaterThan(
      0,
    )
    expect(body.findAllComponents(IconDashCircle).length).toBeGreaterThan(0)
  })

  it("shows only the base legend entries when signed out", () => {
    const wrapper = mountInfo({
      info: makeInfo(capabilities),
      isLoggedIn: false,
    })
    expect(wrapper.get(".column-gap-3").findAll("span")).toHaveLength(3)
  })

  it("adds the two authorization legend entries when signed in", () => {
    const wrapper = mountInfo({
      info: makeInfo(capabilities),
      isLoggedIn: true,
    })
    expect(wrapper.get(".column-gap-3").findAll("span")).toHaveLength(5)
  })
})
