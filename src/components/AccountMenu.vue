<script setup>
import { computed, inject } from "vue"
import {
  BNavItem,
  BNavItemDropdown,
  BDropdownDivider,
  BDropdownItemButton,
  BDropdownText,
  BSpinner,
} from "bootstrap-vue-next"
import IconPersonCircle from "~icons/bi/person-circle"
import IconBoxArrowRight from "~icons/bi/box-arrow-right"
import IconGear from "~icons/bi/gear"

const props = defineProps({
  redirect: { type: Boolean, default: true },
  inline: { type: Boolean, default: false },
})

const login = inject("login")

const isConnected = computed(() => login.connected)
const isSignedIn = computed(() => login.loggedIn)
const isConnecting = computed(() => !login.connected && !login.lastError)
const userName = computed(() => login.user?.name ?? "Account")

/**
 * List the providers the user signed in with, resolving display names.
 *
 * @returns {Array<{providerId: string, name: string}>} One entry per identity.
 */
const identities = computed(() => {
  const userIdentities = login.user?.identities ?? {}
  const providers = login.providers ?? []
  return Object.keys(userIdentities).map((providerId) => {
    const provider = providers.find((entry) => entry.id === providerId) ?? null
    return { providerId, name: provider?.name ?? providerId }
  })
})

/**
 * Map the current connection error to a human-readable hint for the disabled
 * link.
 *
 * @returns {?string} Hint text, or null when there is no error.
 */
const connectionError = computed(() => {
  const error = login.lastError
  if (!error) return null
  const errors = login.errors ?? {}
  if (
    errors.NoInternetConnectionError &&
    error instanceof errors.NoInternetConnectionError
  )
    return "Please check your internet connection."
  if (
    errors.ThirdPartyCookiesBlockedError &&
    error instanceof errors.ThirdPartyCookiesBlockedError
  )
    return "Sign in requires third-party cookies to be enabled."
  if (
    errors.ServerConnectionError &&
    error instanceof errors.ServerConnectionError
  )
    return "The login server is currently unreachable."
  return "The login server is currently unavailable."
})

/**
 * Open the login window, optionally redirecting back after sign in.
 */
function signIn() {
  login.openLoginWindow({ redirect: props.redirect })
}

/**
 * Sign out via a popup that self-closes, keeping the user in the app.
 */
function signOut() {
  login.openLogoutWindow({ redirect: false })
}

/**
 * Open the login server's page where the account can be managed.
 */
function manageAccount() {
  login.openBaseWindow()
}
</script>

<template>
  <!-- Signed in, inline: flat panel for the offcanvas, no dropdown -->
  <div v-if="isSignedIn && inline" class="account-menu-inline">
    <div class="account-menu-name">{{ userName }}</div>

    <div
      v-for="identity in identities"
      :key="identity.providerId"
      class="account-menu-identity"
    >
      Signed in via {{ identity.name }}
    </div>

    <button type="button" class="account-menu-item" @click="manageAccount">
      <IconGear class="me-2" aria-hidden="true" />Manage account
    </button>
    <button type="button" class="account-menu-item" @click="signOut">
      <IconBoxArrowRight class="me-2" aria-hidden="true" />Sign out
    </button>
  </div>

  <!-- Signed in -->
  <BNavItemDropdown
    v-else-if="isSignedIn"
    class="account-menu"
    toggle-class="account-menu-toggle"
    no-caret
    end
  >
    <template #button-content>
      <IconPersonCircle class="account-menu-icon" aria-hidden="true" />
      <span class="visually-hidden">{{ userName }}</span>
    </template>
    <BDropdownText class="account-menu-name">{{ userName }}</BDropdownText>

    <BDropdownText
      v-for="identity in identities"
      :key="identity.providerId"
      class="account-menu-identity"
    >
      Signed in via {{ identity.name }}
    </BDropdownText>

    <BDropdownDivider />
    <BDropdownItemButton @click="manageAccount">
      <IconGear class="me-2" aria-hidden="true" />Manage account
    </BDropdownItemButton>
    <BDropdownItemButton @click="signOut">
      <IconBoxArrowRight class="me-2" aria-hidden="true" />Sign out
    </BDropdownItemButton>
  </BNavItemDropdown>

  <!-- Signed out: a plain nav link -->
  <BNavItem
    v-else-if="isConnected"
    class="account-menu account-menu-signin"
    href="#"
    @click.prevent="signIn"
  >
    Sign in
  </BNavItem>

  <!-- Connecting or connection error: disabled nav link -->
  <BNavItem
    v-else
    class="account-menu account-menu-signin"
    disabled
    :title="connectionError"
  >
    <BSpinner v-if="isConnecting" small class="me-1" />Sign in
  </BNavItem>
</template>
