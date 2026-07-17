import { defineStore } from "pinia"
import { ref, watch } from "vue"
import { cdk } from "cocoda-sdk"
import { parseCapabilities } from "@/utils/capabilities"
import { OBJECT_TYPES } from "@/utils/objectTypes"
import { useAuth } from "@/composables/useAuth"

const LS_URL_KEY = "jskos-server-ui:activeUrl"
const LS_SERVERS_KEY = "jskos-server-ui:servers"

export const useServerStore = defineStore("server", () => {
  const activeUrl = ref(localStorage.getItem(LS_URL_KEY) ?? null)
  const servers = ref(JSON.parse(localStorage.getItem(LS_SERVERS_KEY) ?? "[]"))
  const registry = ref(null)
  const mappingsRegistry = ref(null)
  const status = ref(null)
  const capabilities = ref(null)
  const authorizationMatrix = ref(null)
  const service = ref(null)
  const error = ref(null)

  const { user, token, loginPublicKey } = useAuth()

  function registryForType(type) {
    return OBJECT_TYPES[type]?.registry === "mappingsRegistry"
      ? mappingsRegistry.value
      : registry.value
  }

  /**
   * Rebuilds the authorization matrix from the current capabilities and
   * the logged-in user.
   *
   * @returns {?Object<string, Object<string, boolean>>} Matrix keyed by type
   *     and action, or `null` when no capabilities are loaded.
   */
  function computeAuthorizationMatrix() {
    const caps = capabilities.value
    if (!caps) return null
    const matrix = {}
    for (const [type, actions] of Object.entries(caps)) {
      if (!actions) continue
      for (const [action, cap] of Object.entries(actions)) {
        if (!cap?.requiresAuth) continue
        const reg = registryForType(type)
        if (!reg) continue
        matrix[type] ??= {}
        matrix[type][action] = reg.isAuthorizedFor({
          type,
          action,
          user: user.value,
        })
      }
    }
    return matrix
  }

  /**
   * Pushes the current login credentials into both registries and refreshes the
   * authorization matrix.
   */
  function syncAuth() {
    const auth = { key: loginPublicKey.value, bearerToken: token.value }
    registry.value?.setAuth(auth)
    mappingsRegistry.value?.setAuth(auth)
    authorizationMatrix.value = computeAuthorizationMatrix()
  }

  // Keep registry auth and authorization in sync when the login state changes
  watch([user, token, loginPublicKey], syncAuth)

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
      syncAuth()
      activeUrl.value = url
      localStorage.setItem(LS_URL_KEY, url)
      if (!servers.value.includes(url)) {
        servers.value = [...servers.value, url]
        localStorage.setItem(LS_SERVERS_KEY, JSON.stringify(servers.value))
      }
      if (status.value) {
        const cfg = status.value
        service.value = {
          prefLabel: cfg.title ? { en: cfg.title } : null,
          version: cfg.serverVersion,
          API_VERSION: cfg.version,
          api: "http://bartoc.org/api-type/jskos",
          endpoint: cfg.baseUrl ?? activeUrl,
          ENV: cfg.env,
          AUTH: cfg.auth === true,
          CAPABILITIES: capabilities,
        }
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
    authorizationMatrix.value = null
    service.value = null
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

  function isSupported(type, action) {
    return capabilities.value?.[type]?.[action] != null
  }

  function requiresAuth(type, action) {
    return capabilities.value?.[type]?.[action]?.requiresAuth ?? false
  }

  /**
   * Returns whether the currently logged-in user is authorized for the given
   * action.
   *
   * @param {string} type Capability type (e.g. `"schemes"`, `"mappings"`).
   * @param {string} action Action to check (`"read"`, `"create"`, `"update"`,
   *     or `"delete"`).
   * @returns {boolean} Whether the user is authorized; `false` when not
   *     connected.
   */
  function isAuthorizedFor(type, action) {
    const reg = registryForType(type)
    if (!reg) return false
    return reg.isAuthorizedFor({ type, action, user: user.value })
  }

  return {
    activeUrl,
    servers,
    registry,
    mappingsRegistry,
    status,
    capabilities,
    authorizationMatrix,
    service,
    error,
    connectToServer,
    disconnectServer,
    removeServer,
    isSupported,
    requiresAuth,
    isAuthorizedFor,
  }
})
