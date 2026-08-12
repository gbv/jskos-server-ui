import { h } from "vue"
import { useToast } from "bootstrap-vue-next"
import ToastMessage from "@/components/ToastMessage.vue"

const DEFAULT_DURATION = 4000
const FAILURE_DURATION = 12000
const VARIANTS_WITH_WHITE_TEXT = ["success", "warning", "danger"]

export function useNotify() {
  const toast = useToast()

  /**
   * Shows a toast notification in the bottom right corner.
   *
   * @param {string} body The message to display.
   * @param {string=} variant Bootstrap variant deciding icon, color and
   *     display duration.
   */
  function notify(body, variant = "info") {
    toast.create({
      slots: { default: () => h(ToastMessage, { body, variant }) },
      variant,
      pos: "bottom-end",
      closeClass: VARIANTS_WITH_WHITE_TEXT.includes(variant)
        ? "btn-close-white"
        : undefined,
      modelValue: variant === "danger" ? FAILURE_DURATION : DEFAULT_DURATION,
    })
  }
  return { notify }
}
