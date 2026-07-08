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
import { useConfigStore } from "@/stores/config"
import { useThemeStore } from "@/stores/theme"
import { useServerStore } from "@/stores/server"

const store = useServerStore()
const config = useConfigStore()
const offcanvasVisible = ref(false)
const theme = useThemeStore()

const navLinks = [
  { to: "/", label: "Overview" },
  { to: "/connection", label: "Connection" },
]

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
      <BNavbarNav class="gap-2">
        <BNavItem
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          tag="router-link"
          @click="offcanvasVisible = false"
        >
          {{ link.label }}
        </BNavItem>
        <hr />
        <div v-if="config.loginEnabled" class="app-navbar-panel">
          <div class="app-navbar-panel-label">Account</div>
          <UserStatus redirect />
        </div>
        <ThemeToggle v-model="theme.dark" label="Appearance" />
      </BNavbarNav>
    </BOffcanvas>

    <BNavbarNav
      class="gap-2 ms-auto mb-2 mb-md-0 d-none d-md-flex align-items-center"
    >
      <BNavItem
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        tag="router-link"
      >
        {{ link.label }}
      </BNavItem>
      <BNavItem class="py-0">
        <div
          class="vr d-none d-md-flex opacity-50"
          style="height: 1.3rem"
        ></div>
      </BNavItem>
      <BNavItem v-if="config.loginEnabled" class="py-0 app-navbar-account">
        <UserStatus redirect />
      </BNavItem>
      <ThemeToggle v-model="theme.dark" />
    </BNavbarNav>
  </BNavbar>
</template>
