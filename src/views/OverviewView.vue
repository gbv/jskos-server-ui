<script setup>
import { ref, reactive, watch, computed } from "vue"
import { BSpinner } from "bootstrap-vue-next"
import IconLockFill from "~icons/bi/lock-fill"
import IconDashCircle from "~icons/bi/dash-circle"
import { useServerStore } from "@/stores/server"
import { useAuth } from "@/composables/useAuth"
import { useTypeAccess } from "@/composables/useTypeAccess"
import { OBJECT_TYPES } from "@/utils/objectTypes"
import ViewTitle from "@/components/ViewTitle.vue"
import { useCountUp } from "@/composables/useCountUp"

const store = useServerStore()
const { loggedIn } = useAuth()
const { resolveAccess } = useTypeAccess()

const STATS = Object.entries(OBJECT_TYPES)
  .filter(([, config]) => config.count)
  .map(([key, config]) => ({
    key,
    label: config.label,
    route: config.route ?? null,
    method: config.count,
    registry: config.registry,
  }))

const counts = ref({})
const loadingCounts = ref({})
const errorCounts = ref({})
const countEls = reactive({})

const access = computed(() =>
  Object.fromEntries(STATS.map((s) => [s.key, resolveAccess(s.key)])),
)

/**
 * Returns the tooltip text explaining why a locked card is not navigable.
 *
 * @param {{key: string, label: string}} stat the stat definition
 * @returns {?string} the tooltip text, or undefined for an open card
 */
function lockTitle(stat) {
  switch (access.value[stat.key]) {
    case "auth-required":
      return `Sign in to view ${stat.label}`
    case "denied":
      return `Not authorized to read ${stat.label}`
    case "unsupported":
      return `${stat.label} not offered by this server`
    default:
      return undefined
  }
}

// One useCountUp per stat — watches its own el + value ref
for (const s of STATS) {
  const elRef = computed(() => countEls[s.key])
  const valRef = computed(() => counts.value[s.key])
  useCountUp(elRef, valRef)
}

async function fetchAllCounts() {
  counts.value = {}
  errorCounts.value = {}
  const readable = STATS.filter((s) => access.value[s.key] === "open")
  loadingCounts.value = Object.fromEntries(readable.map((s) => [s.key, true]))

  await Promise.allSettled(
    readable.map(async (s) => {
      try {
        const reg = store[s.registry]
        const n = (await reg[s.method]({ limit: 0 }))?._totalCount
        if (n !== undefined) counts.value = { ...counts.value, [s.key]: n }
      } catch (e) {
        errorCounts.value = { ...errorCounts.value, [s.key]: true }
      } finally {
        loadingCounts.value = { ...loadingCounts.value, [s.key]: false }
      }
    }),
  )
}

watch(
  [() => store.registry, () => store.authorizationMatrix, loggedIn],
  () => {
    if (store.registry) {
      fetchAllCounts()
    } else {
      counts.value = {}
      loadingCounts.value = {}
      errorCounts.value = {}
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="!store.activeUrl"
    class="not-connected text-center py-5 text-muted"
  >
    No server connected.
    <router-link to="/connection">Connect to a jskos-server</router-link>
    to see the dashboard.
  </div>

  <div v-else>
    <ViewTitle>Overview</ViewTitle>

    <div class="cards-grid">
      <template v-for="s in STATS" :key="s.key">
        <component
          :is="access[s.key] === 'open' && s.route ? 'router-link' : 'div'"
          v-if="store.capabilities?.[s.key] !== null"
          :to="access[s.key] === 'open' && s.route ? s.route : undefined"
          class="type-card"
          :class="{ 'type-card-locked': access[s.key] !== 'open' }"
          :title="lockTitle(s)"
        >
          <div class="card-label">{{ s.label }}</div>
          <div class="card-count">
            <template v-if="access[s.key] === 'open'">
              <BSpinner v-if="loadingCounts[s.key]" small />
              <span
                v-else-if="errorCounts[s.key]"
                class="count-na"
                title="Failed to load"
                >✕</span
              >

              <span v-else-if="counts[s.key] == null" class="count-na">—</span>
              <span v-else :ref="(el) => (countEls[s.key] = el)"></span>
            </template>
            <IconLockFill
              v-else-if="access[s.key] === 'auth-required'"
              class="text-warning"
            />
            <IconLockFill
              v-else-if="access[s.key] === 'denied'"
              class="text-danger"
            />
            <IconDashCircle v-else class="text-secondary" />
          </div>
        </component>
      </template>
    </div>
  </div>
</template>
