const TYPES = [
  "schemes",
  "concepts",
  "mappings",
  "concordances",
  "annotations",
  "registries",
  "types",
  "occurrences",
]
const ACTIONS = ["read", "create", "update", "delete"]

/**
 * Parses a jskos-server status config object into a normalized capabilities map.
 * Falls back to registry object if registry has no config object.
 *
 * Result shape:
 *   { mappings: { read: { supported: true, requiresAuth: false }, create: { ... }, ... }, registries: null, ... }
 *
 * A type entry is null if the type is not enabled on the server.
 * An action entry is null if the action is not configured for that type.
 */
export function parseCapabilities(registry) {
  const config = registry._config
  const result = {}
  for (const type of TYPES) {
    var typeCfg = config?.[type] || registry.has?.[type]
    if (!typeCfg) {
      result[type] = null
      continue
    } else if (typeCfg === true) {
      // non-detailed capabilities
      typeCfg = { read: true }
    }
    result[type] = {}
    for (const action of ACTIONS) {
      const actionCfg = typeCfg[action]
      if (!actionCfg) {
        result[type][action] = null
        continue
      }
      result[type][action] = {
        supported: true,
        requiresAuth: actionCfg.auth === true,
      }
    }
  }
  return result
}
