<script setup>
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { BApp } from "bootstrap-vue-next"
import AppFooter from "@/components/AppFooter.vue"
import AppNavbar from "@/components/AppNavbar.vue"
import { useConfigStore } from "@/stores/config"
import { useServerStore } from "@/stores/server"
import { useThemeStore } from "@/stores/theme"
import { useNotify } from "@/composables/useNotify"

const config = useConfigStore()
const server = useServerStore()
const router = useRouter()
const { notify } = useNotify()
useThemeStore()

onMounted(async () => {
  await config.loadConfig()
  const url = server.activeUrl ?? config.defaultService?.endpoint ?? null
  if (url) {
    await server.connectToServer(url)
    if (server.error) {
      notify(`Connection to ${url} failed: ${server.error}`, "danger")
      router.push({ name: "connection" })
    }
  }
})
</script>

<template>
  <BApp>
    <AppNavbar />

    <main class="container py-4 flex-grow-1">
      <router-view />
    </main>

    <AppFooter />
  </BApp>
</template>
