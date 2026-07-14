import { computed } from "vue"
import { user, token, loggedIn, about } from "gbv-login-client-vue/login"

/**
 * Exposes the gbv-login-client reactive primitives together with the login
 * server's public key.
 *
 * @returns {{user: Ref, token: Ref, loggedIn: Ref, loginPublicKey: Ref}}
 *     Reactive login state.
 */
export function useAuth() {
  const loginPublicKey = computed(() => about.value?.publicKey ?? null)
  return { user, token, loggedIn, loginPublicKey }
}
