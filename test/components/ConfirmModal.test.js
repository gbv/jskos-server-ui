import { mount } from "@vue/test-utils"
import ConfirmModal from "@/components/ConfirmModal.vue"

const BModalStub = {
  props: ["modelValue", "title", "okTitle", "okVariant"],
  emits: ["ok", "update:modelValue"],
  template:
    "<div v-if='modelValue' class='stub-modal'>" +
    "<div class='stub-title'>{{ title }}</div>" +
    "<slot />" +
    "<button class='stub-ok' @click=\"$emit('ok'); $emit('update:modelValue', false)\">{{ okTitle }}</button>" +
    "</div>",
}

function mountModal(props = {}) {
  return mount(ConfirmModal, {
    props: { modelValue: true, ...props },
    slots: { default: "Are you sure?" },
    global: {
      stubs: { BModal: BModalStub },
    },
  })
}

describe("ConfirmModal", () => {
  it("renders title, slot content, and the confirm label when visible", () => {
    const wrapper = mountModal({
      title: "Confirm deletion",
      confirmLabel: "Delete",
    })

    expect(wrapper.find(".stub-title").text()).toBe("Confirm deletion")
    expect(wrapper.text()).toContain("Are you sure?")
    expect(wrapper.find(".stub-ok").text()).toBe("Delete")
  })

  it("renders nothing when hidden", () => {
    const wrapper = mountModal({ modelValue: false })

    expect(wrapper.find(".stub-modal").exists()).toBe(false)
  })

  it("emits confirm and closes when the user confirms", async () => {
    const wrapper = mountModal()

    await wrapper.find(".stub-ok").trigger("click")

    expect(wrapper.emitted("confirm")).toHaveLength(1)
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false])
  })
})
