import { defineStore } from "pinia"
import { ref } from "vue"
import { cdk } from "cocoda-sdk"
import { parseCapabilities } from "@/utils/capabilities"

const LS_URL_KEY = "jskos-server-ui:activeUrl"
const LS_SERVERS_KEY = "jskos-server-ui:servers"

export const useServerStore = defineStore("server", () => {
  const activeUrl = ref(localStorage.getItem(LS_URL_KEY) ?? null)
  const servers = ref(JSON.parse(localStorage.getItem(LS_SERVERS_KEY) ?? "[]"))
  const registry = ref(null)
  const mappingsRegistry = ref(null)
  const status = ref(null)
  const capabilities = ref(null)
  const error = ref(null)

  async function connectToServer(url) {
    error.value = null
    status.value = null
    try {
      const reg = cdk.initializeRegistry({
        provider: "ConceptApi",
        api: url,
        uri: url,
      })
      await reg.init()
      if (!reg._config || !Object.keys(reg._config).length) {
        throw new Error(
          "Server did not return a status. Check the URL and try again.",
        )
      }
      const mappingsReg = cdk.initializeRegistry({
        provider: "MappingsApi",
        api: url,
        uri: url + "#mappings",
      })
      await mappingsReg.init()
      registry.value = reg
      mappingsRegistry.value = mappingsReg
      status.value = reg._config
      capabilities.value = parseCapabilities(reg)
      activeUrl.value = url
      localStorage.setItem(LS_URL_KEY, url)
      if (!servers.value.includes(url)) {
        servers.value = [...servers.value, url]
        localStorage.setItem(LS_SERVERS_KEY, JSON.stringify(servers.value))
      }
    } catch (e) {
      error.value = e?.message ?? String(e)
      activeUrl.value = null
      localStorage.removeItem(LS_URL_KEY)
    }
  }

  function disconnectServer() {
    registry.value = null
    mappingsRegistry.value = null
    status.value = null
    capabilities.value = null
    error.value = null
    activeUrl.value = null
    localStorage.removeItem(LS_URL_KEY)
  }

  function removeServer(url) {
    servers.value = servers.value.filter((s) => s !== url)
    localStorage.setItem(LS_SERVERS_KEY, JSON.stringify(servers.value))
    if (activeUrl.value === url) {
      disconnectServer()
    }
  }

  function canDo(type, action) {
    return capabilities.value?.[type]?.[action] != null
  }

  function requiresAuth(type, action) {
    return capabilities.value?.[type]?.[action]?.requiresAuth ?? false
  }

  return {
    activeUrl,
    servers,
    registry,
    mappingsRegistry,
    status,
    capabilities,
    error,
    connectToServer,
    disconnectServer,
    removeServer,
    canDo,
    requiresAuth,
  }
})
