import { defineStore } from "pinia"
import { ref } from "vue"

export const useConfigStore = defineStore("config", () => {
  const defaultService = ref(null)
  const footerLinks = ref([])

  async function loadConfig() {
    try {
      const res = await fetch("config.json")
      if (!res.ok) return
      const { services, footer } = await res.json()
      defaultService.value =
        services?.filter(
          ({ api }) => "http://bartoc.org/api-type/jskos",
        )?.[0] ?? null
      footerLinks.value = footer?.links ?? []
    } catch {
      // config.json not available, use defaults
    }
  }

  return { defaultService, footerLinks, loadConfig }
})
