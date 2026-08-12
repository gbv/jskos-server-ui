import { mount } from "@vue/test-utils"
import EmptyState from "@/components/EmptyState.vue"

describe("EmptyState", () => {
  it("renders the message from the default slot", () => {
    const wrapper = mount(EmptyState, {
      slots: { default: "No server connected." },
    })
    expect(wrapper.text()).toContain("No server connected.")
  })

  it("omits title, icon and actions unless they are provided", () => {
    const wrapper = mount(EmptyState, { slots: { default: "Nothing here." } })

    expect(wrapper.find(".empty-state-title").exists()).toBe(false)
    expect(wrapper.find(".empty-state-icon").exists()).toBe(false)
    expect(wrapper.find(".empty-state-actions").exists()).toBe(false)
  })

  it("renders title, icon and actions when given", () => {
    const wrapper = mount(EmptyState, {
      props: { title: "Import not available" },
      slots: {
        default: "This server accepts no imports.",
        icon: "<svg class='test-icon' />",
        actions: "<button>Sign in</button>",
      },
    })

    expect(wrapper.find(".empty-state-title").text()).toBe(
      "Import not available",
    )
    expect(wrapper.find(".empty-state-icon .test-icon").exists()).toBe(true)
    expect(wrapper.find(".empty-state-actions button").text()).toBe("Sign in")
  })
})
