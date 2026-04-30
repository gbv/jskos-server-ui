import { watch } from "vue"
import { CountUp } from "countup.js"

export function useCountUp(elRef, valueRef, options = {}) {
  watch([elRef, valueRef], ([el, value]) => {
    if (!el || value == null) return
    new CountUp(el, value, {
      duration: 1.5,
      separator: ",",
      ...options,
    }).start()
  })
}
