<script setup>
import { ref, computed } from "vue"
import { BButton, BBadge, BSpinner, BCard, BAlert } from "bootstrap-vue-next"
import ViewTitle from "@/components/ViewTitle.vue"
import { RemoveIcon } from "jskos-vue"
import { BIconCheckCircleFill, BIconLockFill, BIconDashCircle } from "bootstrap-icons-vue"
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

function handleDisconnect() {
  const url = store.activeUrl
  store.disconnectServer()
  urlInput.value = ""
  notify(`Disconnected from ${url}`, "warning")
}

const serverInfo = computed(() => {
  const cfg = store.status
  if (!cfg) return null
  return {
    title: cfg.title ?? "JSKOS Server",
    version: cfg.version ?? "—",
    serverVersion: cfg.serverVersion ?? "—",
    baseUrl: cfg.baseUrl ?? store.activeUrl,
    env: cfg.env ?? "—",
    auth: cfg.auth === true,
  }
})

const CAPABILITY_TYPES = ["schemes", "concepts", "mappings", "concordances", "annotations", "registries"]
const CAPABILITY_ACTIONS = ["read", "create", "update", "delete"]
</script>

<template>
  <div>
    <ViewTitle>Connection to jskos-server</ViewTitle>

      <!-- Connected state -->
      <BCard v-if="store.activeUrl" no-body>
        <template #header>
          <div class="d-flex align-items-center justify-content-between gap-2">
            <div class="d-flex align-items-center gap-2 fw-bold">
              {{ serverInfo?.title }}
              <BBadge variant="success">Connected</BBadge>
            </div>
            <BButton
              variant="outline-danger"
              size="sm"
              @click="handleDisconnect"
            >
              Disconnect
            </BButton>
          </div>
        </template>

        <div class="card-body">
          <dl class="row small mb-0">
            <dt class="col-sm-4 text-muted">URL</dt>
            <dd class="col-sm-8 mb-1">
              <code>{{ serverInfo?.baseUrl }}</code>
            </dd>

            <dt class="col-sm-4 text-muted">API Version</dt>
            <dd class="col-sm-8 mb-1">{{ serverInfo?.version }}</dd>

            <dt class="col-sm-4 text-muted">Server Version</dt>
            <dd class="col-sm-8 mb-1">{{ serverInfo?.serverVersion }}</dd>

            <dt class="col-sm-4 text-muted">Environment</dt>
            <dd class="col-sm-8 mb-1">{{ serverInfo?.env }}</dd>

            <dt class="col-sm-4 text-muted">Authentication</dt>
            <dd class="col-sm-8 mb-0">
              {{ serverInfo?.auth ? "Required" : "Not required" }}
            </dd>
          </dl>

          <hr class="my-3" />

          <table class="table table-sm table-borderless small mb-0">
            <thead>
              <tr>
                <th class="text-muted fw-normal ps-0">Type</th>
                <th v-for="action in CAPABILITY_ACTIONS" :key="action" class="text-muted fw-normal text-center text-capitalize">{{ action }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="type in CAPABILITY_TYPES" :key="type">
                <td class="text-capitalize ps-0">{{ type }}</td>
                <td v-for="action in CAPABILITY_ACTIONS" :key="action" class="text-center">
                  <template v-if="store.capabilities?.[type] === null">
                    <BIconDashCircle v-if="action === 'read'" class="text-secondary" />
                  </template>
                  <template v-else-if="store.capabilities?.[type]?.[action] === null">
                    <BIconDashCircle class="text-secondary" />
                  </template>
                  <BIconLockFill v-else-if="store.requiresAuth(type, action)" class="text-warning" />
                  <BIconCheckCircleFill v-else class="text-success" />
                </td>
              </tr>
            </tbody>
          </table>

          <div class="d-flex gap-3 mt-2 small text-muted">
            <span class="d-inline-flex align-items-center"><BIconCheckCircleFill class="text-success me-1" />Open</span>
            <span class="d-inline-flex align-items-center"><BIconLockFill class="text-warning me-1" />Auth required</span>
            <span class="d-inline-flex align-items-center"><BIconDashCircle class="text-secondary me-1" />Not supported</span>
          </div>
        </div>
      </BCard>

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
