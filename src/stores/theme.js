import { defineStore } from "pinia"
import { ref, watch } from "vue"

const STORAGE_KEY = "jskos-server-ui-theme"

export const useThemeStore = defineStore("theme", () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  const dark = ref(
    stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  )

  function applyTheme() {
    document.documentElement.setAttribute(
      "data-bs-theme",
      dark.value ? "dark" : "light",
    )
  }

  watch(dark, () => {
    localStorage.setItem(STORAGE_KEY, dark.value ? "dark" : "light")
    applyTheme()
  })

  applyTheme()

  return { dark }
})
