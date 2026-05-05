<script setup>
import { ref, computed } from "vue"
import { BButton, BSpinner, BCard, BAlert } from "bootstrap-vue-next"
import ViewTitle from "@/components/ViewTitle.vue"
import ServiceInfo from "@/components/ServiceInfo.vue"
import { RemoveIcon } from "jskos-vue"
import {
  BIconCheckCircleFill,
  BIconLockFill,
  BIconDashCircle,
} from "bootstrap-icons-vue"
import { useServerStore } from "@/stores/server"
import { useNotify } from "@/composables/useNotify"

const store = useServerStore()
const urlInput = ref(store.activeUrl ?? "")
const loading = ref(false)
const { notify } = useNotify()

async function connect(url) {
  if (!url) return
  loading.value = true
  await store.connectToServer(url)
  loading.value = false
  if (store.error) {
    notify(`Connection failed: ${store.error}`, "danger")
  } else {
    notify(`Connected to ${url}`, "success")
  }
}

async function handleConnect() {
  await connect(urlInput.value.trim())
}

async function connectFromHistory(url) {
  urlInput.value = url
  await connect(url)
}

// Returns a JSKOS Service object
const serviceInfo = computed(() => {
  const cfg = store.status
  if (!cfg) return null
  return {
    prefLabel: cfg.title ? { en: cfg.title } : null,
    version: cfg.serverVersion,
    API_VERSION: cfg.version,
    api: "http://bartoc.org/api-type/jskos",
    endpoint: cfg.baseUrl ?? store.activeUrl,
    ENV: cfg.env,
    AUTH: cfg.auth === true,
    CAPABILITIES: store.capabilities,
  }
})
</script>

<template>
  <div>
    <ViewTitle>Connection to jskos-server</ViewTitle>

    <!-- Connected state -->
    <ServiceInfo v-if="store.activeUrl" :info="serviceInfo" />

    <!-- Disconnected state -->
    <template v-else>
      <BAlert v-if="store.error" variant="danger" class="mb-3">
        {{ store.error }}
      </BAlert>

      <div class="input-group mb-2">
        <input
          v-model="urlInput"
          type="url"
          class="form-control"
          placeholder="https://your-jskos-server.example.org/"
          :disabled="loading"
          @keydown.enter="handleConnect"
        />
        <BButton
          variant="primary"
          :disabled="loading || !urlInput.trim()"
          @click="handleConnect"
        >
          <BSpinner v-if="loading" small class="me-1" />
          {{ loading ? "Connecting…" : "Connect" }}
        </BButton>
      </div>

      <div v-if="store.servers.length" class="mt-4">
        <h3 class="h6 text-muted mb-2">Select previous servers</h3>
        <ul class="list-group">
          <li
            v-for="url in store.servers"
            :key="url"
            class="list-group-item d-flex align-items-center gap-2"
          >
            <button
              class="btn btn-link text-start p-0 flex-grow-1 text-truncate link-primary-color"
              @click="connectFromHistory(url)"
            >
              {{ url }}
            </button>
            <RemoveIcon
              aria-label="Remove URL"
              @click="store.removeServer(url)"
            />
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
