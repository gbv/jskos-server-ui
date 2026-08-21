import { mount } from "@vue/test-utils"
import ToastMessage from "@/components/ToastMessage.vue"

function iconMarkup(wrapper) {
  return wrapper.find(".toast-message-icon").html()
}

describe("ToastMessage", () => {
  it("renders the message next to an icon", () => {
    const wrapper = mount(ToastMessage, { props: { body: "All done." } })

    expect(wrapper.text()).toContain("All done.")
    expect(wrapper.find(".toast-message-icon").exists()).toBe(true)
  })

  it("uses a different icon per variant", () => {
    const icons = ["info", "success", "warning", "danger"].map((variant) =>
      iconMarkup(mount(ToastMessage, { props: { body: "Message", variant } })),
    )

    expect(new Set(icons).size).toBe(icons.length)
  })

  it("falls back to the info icon for an unknown variant", () => {
    const info = mount(ToastMessage, { props: { body: "Message" } })
    const unknown = mount(ToastMessage, {
      props: { body: "Message", variant: "primary" },
    })

    expect(iconMarkup(unknown)).toBe(iconMarkup(info))
  })

  it("rejects a variant it has no icon for", () => {
    const { validator } = ToastMessage.props.variant
    expect(validator("danger")).toBe(true)
    expect(validator("primary")).toBe(false)
  })

  it("keeps the orchestrator scope out of the markup", () => {
    const wrapper = mount(ToastMessage, {
      props: { body: "Message" },
      attrs: { id: "toast-1", visible: true },
    })

    expect(wrapper.attributes("id")).toBeUndefined()
  })
})
