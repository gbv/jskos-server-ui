<script setup>
import { ref, reactive, watch, computed } from "vue"
import { BSpinner } from "bootstrap-vue-next"
import { useServerStore } from "@/stores/server"
import ViewTitle from "@/components/ViewTitle.vue"
import { useCountUp } from "@/composables/useCountUp"

const store = useServerStore()

const STATS = [
  {
    key: "schemes",
    label: "Terminologies",
    route: "/terminologies",
    method: "getSchemes",
  },
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
  {
    key: "annotations",
    label: "Annotations",
    route: "/annotations",
    method: "getAnnotations",
  },
  // TODO: show concepts once cocoda-sdk supports it
  // { key: "concepts",     label: "Concepts",      route: "/concepts", method: "getConcepts" },
  // TODO: show registries once cocoda-sdk supports it
  // { key: "registries",   label: "Registries",    route: "/registries", method: "getRegistries" },
  { key: "types", label: "Types", route: "/types", method: "getTypes" },
]

const counts = ref({})
const loadingCounts = ref({})
const errorCounts = ref({})
const countEls = reactive({})

// One useCountUp per stat — watches its own el + value ref
for (const s of STATS) {
  const elRef = computed(() => countEls[s.key])
  const valRef = computed(() => counts.value[s.key])
  useCountUp(elRef, valRef)
}

async function fetchAllCounts() {
  counts.value = {}
  errorCounts.value = {}
  loadingCounts.value = Object.fromEntries(STATS.map((s) => [s.key, true]))

  await Promise.allSettled(
    STATS.filter((s) => store.capabilities?.[s.key] !== null).map(async (s) => {
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
  () => store.registry,
  (reg) => {
    if (reg) fetchAllCounts()
    else {
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
        <router-link
          v-if="store.capabilities?.[s.key] !== null"
          :to="s.route"
          class="type-card"
        >
          <div class="card-label">{{ s.label }}</div>
          <div class="card-count">
            <BSpinner v-if="loadingCounts[s.key]" small />
            <span
              v-else-if="errorCounts[s.key]"
              class="count-na"
              title="Failed to load"
              >✕</span
            >

            <span v-else-if="counts[s.key] == null" class="count-na">—</span>
            <span v-else :ref="(el) => (countEls[s.key] = el)"></span>
          </div>
        </router-link>
      </template>
    </div>
  </div>
</template>
