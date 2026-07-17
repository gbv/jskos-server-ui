import { useServerStore } from "@/stores/server"
import { useAuth } from "@/composables/useAuth"

/**
 * Provides read-access resolution for a jskos-server object type, shared by the
 * overview cards and the navbar browse menu.
 *
 * @returns {{resolveAccess: function(string): ("unsupported"|"open"|"auth-required"|"denied")}}
 *     Resolver for a type's read-access state.
 */
export function useTypeAccess() {
  const store = useServerStore()
  const { loggedIn } = useAuth()

  /**
   * Resolves whether the current user may read a type, as one of four states.
   * Evaluation order matters: unsupported wins over open, open over the locked
   * states.
   *
   * @param {string} type the capability type key
   * @returns {"unsupported"|"open"|"auth-required"|"denied"} the access state
   */
  function resolveAccess(type) {
    if (!store.isSupported(type, "read")) {
      return "unsupported"
    }
    if (!store.requiresAuth(type, "read")) {
      return "open"
    }
    if (store.isAuthorizedFor(type, "read")) {
      return "open"
    }
    return loggedIn.value ? "denied" : "auth-required"
  }

  return { resolveAccess }
}
