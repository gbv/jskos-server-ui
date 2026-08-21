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

  it("renders the description", () => {
    const wrapper = mountRow({ description: "What this option does." })
    expect(wrapper.find(".import-option-description").text()).toBe(
      "What this option does.",
    )
  })

  it("keeps notices in the control column, below the control", () => {
    const wrapper = mountRow({ notices: '<p class="notice">Careful.</p>' })
    const column = wrapper.find(".import-option-control")

    expect(column.find(".notice").exists()).toBe(true)
    expect(column.element.lastElementChild.classList).toContain("notice")
  })
})
