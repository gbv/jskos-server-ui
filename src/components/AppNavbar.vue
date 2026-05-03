<script setup>
import { ref } from "vue"
import {
  BNavbar,
  BNavbarBrand,
  BNavbarToggle,
  BNavbarNav,
  BNavItem,
  BOffcanvas,
} from "bootstrap-vue-next"
import ThemeToggle from "./ThemeToggle.vue"
import { useThemeStore } from "@/stores/theme"
import coliConcLogo from "@/assets/coli-conc-logo.svg"

const offcanvasVisible = ref(false)
const theme = useThemeStore()

const navLinks = [
  { to: "/", label: "Overview" },
  { to: "/connection", label: "Connection" },
]
</script>

<template>
  <BNavbar toggleable="md" class="app-navbar px-3">
    <BNavbarBrand href="#/">
      <img
        :src="coliConcLogo"
        class="app-navbar-logo d-inline-block align-middle"
        alt="coli-conc logo"
      />
      JSKOS Server UI
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
