import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const useConfigStore = defineStore("config", () => {
  const defaultService = ref(null)
  const footerLinks = ref([])
  const login = ref({})
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref(null)
  const loginEnabled = computed(() => Boolean(login.value?.url))
  let loadPromise = null

  async function loadConfig() {
    if (loaded.value) return
    if (loadPromise) return loadPromise

    loading.value = true
    error.value = null

    loadPromise = (async () => {
      try {
        const res = await fetch("config.json")
        if (!res.ok) return
        const { services, footer, login: loginConfig } = await res.json()
        defaultService.value =
          services?.filter(
            ({ api }) => "http://bartoc.org/api-type/jskos",
          )?.[0] ?? null
        footerLinks.value = footer?.links ?? []
        login.value = loginConfig ?? {}
      } catch (e) {
        error.value = e?.message ?? String(e)
        // config.json not available, use defaults
      } finally {
        loaded.value = true
        loading.value = false
        loadPromise = null
      }
    })()

    return loadPromise
  }

  return {
    defaultService,
    footerLinks,
    login,
    loaded,
    loading,
    error,
    loginEnabled,
    loadConfig,
  }
})
