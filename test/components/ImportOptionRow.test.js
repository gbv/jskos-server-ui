import { mount } from "@vue/test-utils"
import ImportOptionRow from "@/components/import/ImportOptionRow.vue"

function mountRow(slots = {}) {
  return mount(ImportOptionRow, {
    props: { label: "Bulk mode", labelFor: "import-bulk" },
    slots: {
      default: '<input id="import-bulk" type="checkbox">',
      ...slots,
    },
  })
}

describe("ImportOptionRow", () => {
  it("labels the control in the default slot", () => {
    const label = mountRow().find(".import-option-label")

    expect(label.text()).toBe("Bulk mode")
    expect(label.attributes("for")).toBe("import-bulk")
  })

  it("keeps the description in a tooltip rather than in the row", () => {
    const wrapper = mountRow({ description: "What this option does." })

    expect(wrapper.find(".tooltip-inner").text()).toBe("What this option does.")
    expect(wrapper.find(".import-option-description").exists()).toBe(false)
  })

  it("names the info icon after the option it explains", () => {
    const trigger = mountRow().find(".import-option-info-trigger")

    expect(trigger.attributes("aria-label")).toBe("About Bulk mode")
  })

  it("heads a group of controls without labelling any single one", () => {
    const wrapper = mount(ImportOptionRow, {
      props: { label: "Schemes", labelId: "scheme-label" },
      slots: { default: '<input id="a" type="radio">' },
    })
    const heading = wrapper.find(".import-option-label")

    expect(heading.element.tagName).toBe("SPAN")
    expect(heading.attributes("id")).toBe("scheme-label")
  })

  it("keeps notices in the control column, below the control", () => {
    const wrapper = mountRow({ notices: '<p class="notice">Careful.</p>' })
    const column = wrapper.find(".import-option-control")

    expect(column.find(".notice").exists()).toBe(true)
    expect(column.element.lastElementChild.classList).toContain("notice")
  })
})
