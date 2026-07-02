<script setup>
import { ref } from "vue"
import {
  BBadge,
  BButton,
  BNavbar,
  BNavbarBrand,
  BNavbarToggle,
  BNavbarNav,
  BNavItem,
  BOffcanvas,
} from "bootstrap-vue-next"
import ThemeToggle from "./ThemeToggle.vue"
import { useThemeStore } from "@/stores/theme"
import { useNotify } from "@/composables/useNotify"
import { useServerStore } from "@/stores/server"

const store = useServerStore()
const { notify } = useNotify()
const offcanvasVisible = ref(false)
const theme = useThemeStore()

const navLinks = [
  { to: "/", label: "Overview" },
  { to: "/connection", label: "Connection" },
]

function handleDisconnect() {
  const url = store.activeUrl
  store.disconnectServer()
  notify(`Disconnected from ${url}`, "warning")
}
</script>

<template>
  <BNavbar toggleable="md" class="app-navbar px-3">
    <BNavbarBrand href="#/">
      JSKOS Service
      <a :href="store.service.endpoint" v-if="store.service">
        {{ store.service.prefLabel?.en ?? "Connected" }}
      </a>
    </BNavbarBrand>

    <BNavbarToggle target="nav-offcanvas" @click="offcanvasVisible = true" />

    <BOffcanvas
      id="nav-offcanvas"
      v-model="offcanvasVisible"
      placement="end"
      title="JSKOS Server UI"
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
        <ThemeToggle v-model="theme.dark" label="Appearance" />
      </BNavbarNav>
    </BOffcanvas>

    <BButton
      v-if="store.activeUrl"
      variant="outline-danger"
      size="sm"
      @click="handleDisconnect"
    >
      Disconnect
    </BButton>

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
      <ThemeToggle v-model="theme.dark" />
    </BNavbarNav>
  </BNavbar>
</template>
