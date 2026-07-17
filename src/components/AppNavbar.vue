<script setup>
import { ref, computed } from "vue"
import {
  BNavbar,
  BNavbarBrand,
  BNavbarToggle,
  BNavbarNav,
  BNavItem,
  BOffcanvas,
} from "bootstrap-vue-next"
import ThemeToggle from "./ThemeToggle.vue"
import AccountMenu from "./AccountMenu.vue"
import NavbarBrowseMenu from "./NavbarBrowseMenu.vue"
import { useConfigStore } from "@/stores/config"
import { useThemeStore } from "@/stores/theme"
import { useServerStore } from "@/stores/server"

const store = useServerStore()
const config = useConfigStore()
const offcanvasVisible = ref(false)
const theme = useThemeStore()

// Uses the connected server's title when available, otherwise the app name.
const appName = computed(
  () => store.service?.prefLabel?.en ?? "JSKOS Server UI",
)
</script>

<template>
  <BNavbar toggleable="md" class="app-navbar px-3">
    <BNavbarBrand :to="{ name: 'overview' }" tag="router-link">
      {{ appName }}
    </BNavbarBrand>

    <BNavbarToggle target="nav-offcanvas" @click="offcanvasVisible = true" />

    <BOffcanvas
      id="nav-offcanvas"
      v-model="offcanvasVisible"
      placement="end"
      :title="appName"
    >
      <BNavbarNav>
        <BNavItem to="/" tag="router-link" @click="offcanvasVisible = false">
          Overview
        </BNavItem>
        <NavbarBrowseMenu @navigate="offcanvasVisible = false" />
        <BNavItem
          to="/connection"
          tag="router-link"
          @click="offcanvasVisible = false"
        >
          Connection
        </BNavItem>
        <hr />
        <li class="app-navbar-panel">
          <div class="app-navbar-panel-label">Preferences</div>
          <ThemeToggle v-model="theme.dark" label="Appearance" />
        </li>
        <li v-if="config.loginEnabled" class="app-navbar-panel">
          <div class="app-navbar-panel-label">Account</div>
          <AccountMenu inline />
        </li>
      </BNavbarNav>
    </BOffcanvas>

    <BNavbarNav
      class="gap-2 ms-auto mb-2 mb-md-0 d-none d-md-flex align-items-center"
    >
      <BNavItem to="/" tag="router-link">Overview</BNavItem>
      <NavbarBrowseMenu />
      <BNavItem to="/connection" tag="router-link">Connection</BNavItem>
      <BNavItem class="py-0">
        <div
          class="vr d-none d-md-flex opacity-50"
          style="height: 1.3rem"
        ></div>
      </BNavItem>
      <ThemeToggle v-model="theme.dark" />
      <AccountMenu v-if="config.loginEnabled" class="py-0" />
    </BNavbarNav>
  </BNavbar>
</template>
