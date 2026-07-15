<script setup>
import { ref, reactive, watch, computed } from "vue"
import { BSpinner } from "bootstrap-vue-next"
import { BIconLockFill, BIconDashCircle } from "bootstrap-icons-vue"
import { useServerStore } from "@/stores/server"
import { useAuth } from "@/composables/useAuth"
import ViewTitle from "@/components/ViewTitle.vue"
import { useCountUp } from "@/composables/useCountUp"

const store = useServerStore()
const { loggedIn } = useAuth()

const STATS = [
  {
    key: "schemes",
    label: "Terminologies",
    route: "/terminologies",
    method: "getSchemes",
  },
  {
    key: "concepts",
    label: "Concepts",
    route: "/concepts",
    method: "getConcepts",
  },
  { key: "types", label: "Types", route: "/types", method: "getTypes" },
  {
    key: "concordances",
    label: "Concordances",
    route: "/concordances",
    method: "getConcordances",
  },
  {
    key: "mappings",
    label: "Mappings",
    route: "/mappings",
    method: "getMappings",
  },
  // TODO: show registries once cocoda-sdk supports it
  // { key: "registries",   label: "Registries",    route: "/registries", method: "getRegistries" },
  {
    key: "annotations",
    label: "Annotations",
    route: "/annotations",
    method: "getAnnotations",
  },
]

const counts = ref({})
const loadingCounts = ref({})
const errorCounts = ref({})
const countEls = reactive({})

/**
 * Resolves whether the current user may read a type, as one of four card states.
 * Evaluation order matters: unsupported wins over open, open over the locked states.
 *
 * @param {string} key the capability type key
 * @returns {"unsupported"|"open"|"auth-required"|"denied"} the card's access state
 */
function resolveAccess(key) {
  if (!store.isSupported(key, "read")) {
    return "unsupported"
  }
  if (!store.requiresAuth(key, "read")) {
    return "open"
  }
  if (store.isAuthorizedFor(key, "read")) {
    return "open"
  }
  return loggedIn.value ? "denied" : "auth-required"
}

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
        const reg = ["mappings", "concordances", "annotations"].includes(s.key) // TODO: use one store only
          ? store.mappingsRegistry
          : store.registry
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
          :is="access[s.key] === 'open' ? 'router-link' : 'div'"
          v-if="store.capabilities?.[s.key] !== null"
          :to="access[s.key] === 'open' ? s.route : undefined"
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
            <BIconLockFill
              v-else-if="access[s.key] === 'auth-required'"
              class="text-warning"
            />
            <BIconLockFill
              v-else-if="access[s.key] === 'denied'"
              class="text-danger"
            />
            <BIconDashCircle v-else class="text-secondary" />
          </div>
        </component>
      </template>
    </div>
  </div>
</template>
