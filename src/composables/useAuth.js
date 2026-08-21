import { computed } from "vue"
import {
  user,
  token,
  loggedIn,
  about,
  connected,
  openLoginWindow,
} from "gbv-login-client-vue/login"

/**
 * Exposes the gbv-login-client reactive primitives together with the login
 * server's public key.
 *
 * @returns {{user: Ref, token: Ref, loggedIn: Ref, loginPublicKey: Ref,
 *     isLoginConnected: Ref, signIn: function(): void}} Reactive login state
 *     and the sign-in action.
 */
export function useAuth() {
  const loginPublicKey = computed(() => about.value?.publicKey ?? null)

  /**
   * Opens the login window, returning to the current page afterwards.
   */
  function signIn() {
    openLoginWindow({ redirect: true })
  }

  return {
    user,
    token,
    loggedIn,
    loginPublicKey,
    isLoginConnected: connected,
    signIn,
  }
}
