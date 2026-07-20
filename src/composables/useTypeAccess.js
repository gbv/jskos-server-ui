import { useServerStore } from "@/stores/server"
import { useAuth } from "@/composables/useAuth"

/**
 * Provides access resolution for actions on a jskos-server object type.
 *
 * @returns {{resolveAccess: function(string, string=): ("unsupported"|"open"|"auth-required"|"denied")}}
 *     Resolver for a type's access state per action.
 */
export function useTypeAccess() {
  const store = useServerStore()
  const { loggedIn } = useAuth()

  /**
   * Resolves whether the current user may perform an action on a type.
   *
   * @param {string} type the capability type key
   * @param {string} [action="read"] the capability action (`"read"`,
   *     `"create"`, `"update"`, or `"delete"`)
   * @returns {"unsupported"|"open"|"auth-required"|"denied"} the access state
   */
  function resolveAccess(type, action = "read") {
    if (!store.isSupported(type, action)) {
      return "unsupported"
    }
    if (!store.requiresAuth(type, action)) {
      return "open"
    }
    if (store.isAuthorizedFor(type, action)) {
      return "open"
    }
    return loggedIn.value ? "denied" : "auth-required"
  }

  return { resolveAccess }
}
