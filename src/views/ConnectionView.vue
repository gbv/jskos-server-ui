<script setup>
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { BButton, BSpinner, BBadge } from "bootstrap-vue-next"
import ViewTitle from "@/components/ViewTitle.vue"
import ServiceInfo from "@/components/ServiceInfo.vue"
import IconPlug from "~icons/bi/plug"
import IconXLg from "~icons/bi/x-lg"
import { useServerStore } from "@/stores/server"
import { useNotify } from "@/composables/useNotify"
import { useAuth } from "@/composables/useAuth"

const store = useServerStore()
const { loggedIn } = useAuth()
const router = useRouter()
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
    router.push({ name: "overview" })
  }
}

async function handleConnect() {
  await connect(urlInput.value.trim())
}

async function connectFromHistory(url) {
  urlInput.value = url
  await connect(url)
}

function handleDisconnect() {
  const url = store.activeUrl
  store.disconnectServer()
  notify(`Disconnected from ${url}`, "warning")
}

// Returns a JSKOS Service object
const serviceInfo = computed(() => {
  return store.service
})
</script>

<template>
  <div>
    <ViewTitle>Connection</ViewTitle>

    <!-- Connected state -->
    <template v-if="store.activeUrl">
      <ServiceInfo
        :info="serviceInfo"
        :authorization="store.authorizationMatrix"
        :is-logged-in="loggedIn"
      >
        <template #actions>
          <BButton
            variant="outline-secondary"
            size="sm"
            class="d-inline-flex align-items-center gap-1"
            @click="handleDisconnect"
          >
            <IconPlug />
            Disconnect
          </BButton>
        </template>
      </ServiceInfo>
    </template>

    <!-- Disconnected state -->
    <template v-else>
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
        <ul class="list-unstyled d-grid gap-2 mb-0">
          <li
            v-for="server in store.servers"
            :key="server.url"
            class="server-card app-card position-relative d-flex align-items-center gap-2"
          >
            <div class="flex-grow-1 overflow-hidden">
              <div class="d-flex align-items-center gap-2">
                <button
                  class="stretched-link border-0 bg-transparent p-0 text-start text-truncate fw-semibold"
                  @click="connectFromHistory(server.url)"
                >
                  {{ server.title ?? server.url }}
                </button>
                <BBadge
                  v-if="server.env"
                  variant="secondary"
                  class="flex-shrink-0"
                >
                  {{ server.env }}
                </BBadge>
              </div>
              <code class="d-block small text-muted text-truncate">{{
                server.url
              }}</code>
            </div>
            <BButton
              variant="link"
              class="server-remove position-relative z-2 flex-shrink-0 p-2 lh-1 text-decoration-none"
              aria-label="Remove server"
              @click="store.removeServer(server.url)"
            >
              <IconXLg />
            </BButton>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.server-card {
  padding: 0.75rem 1rem;
}

.server-card button {
  cursor: pointer;
}

.server-card .stretched-link:active {
  transform: none;
}

.server-remove {
  color: var(--bs-body-color);
  opacity: 0.5;
  transition:
    opacity 0.15s,
    color 0.15s;
}

.server-card:hover .server-remove {
  opacity: 1;
}

.server-remove:hover,
.server-remove:focus-visible {
  opacity: 1;
  color: var(--bs-danger);
}

@media (hover: none) {
  .server-remove {
    opacity: 1;
  }
}
</style>
