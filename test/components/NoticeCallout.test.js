import { mount } from "@vue/test-utils"
import NoticeCallout from "@/components/NoticeCallout.vue"

describe("NoticeCallout", () => {
  it("renders slot content and warns by default", () => {
    const wrapper = mount(NoticeCallout, {
      slots: { default: "Something needs attention." },
    })

    expect(wrapper.text()).toContain("Something needs attention.")
    expect(wrapper.classes()).toContain("notice-callout-warning")
    expect(wrapper.attributes("role")).toBe("alert")
  })

  it("renders the title only when one is given", () => {
    expect(mount(NoticeCallout).find(".notice-callout-title").exists()).toBe(
      false,
    )

    const titled = mount(NoticeCallout, { props: { title: "Heads up" } })
    expect(titled.find(".notice-callout-title").text()).toBe("Heads up")
  })

  it("switches to the danger treatment", () => {
    const wrapper = mount(NoticeCallout, { props: { variant: "danger" } })
    expect(wrapper.classes()).toContain("notice-callout-danger")
  })

  // A confirmation is announced politely; a problem interrupts.
  it("announces a success without interrupting", () => {
    const wrapper = mount(NoticeCallout, { props: { variant: "success" } })
    expect(wrapper.classes()).toContain("notice-callout-success")
    expect(wrapper.attributes("role")).toBe("status")
  })

  it("rejects a variant it has no styling for", () => {
    const { validator } = NoticeCallout.props.variant
    expect(validator("warning")).toBe(true)
    expect(validator("success")).toBe(true)
    expect(validator("info")).toBe(false)
  })
})
