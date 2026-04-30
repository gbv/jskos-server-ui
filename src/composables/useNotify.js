import { useToast } from "bootstrap-vue-next"

export function useNotify() {
  const toast = useToast()
  function notify(body, variant = "info") {
    toast.create({ body, variant, pos: "bottom-end", modelValue: 4000 })
  }
  return { notify }
}
