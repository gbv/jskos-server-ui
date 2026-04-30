import { defineStore } from "pinia"
import { ref } from "vue"

export const useConfigStore = defineStore("config", () => {
  const defaultServer = ref(null)
  const footerLinks = ref([])

  async function loadConfig() {
    try {
      const res = await fetch("config.json")
      if (!res.ok) return
      const data = await res.json()
      defaultServer.value = data.defaultServer ?? null
      footerLinks.value = data.footer?.links ?? []
    } catch {
      // config.json not available, use defaults
    }
  }

  return { defaultServer, footerLinks, loadConfig }
})
