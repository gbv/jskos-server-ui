<script setup>
import { ref, computed, watch, nextTick } from "vue"
import { BSpinner, BFormSelect, BPagination } from "bootstrap-vue-next"
import { ItemList, ConceptTree } from "jskos-vue"
import * as jskos from "jskos-tools"
import MappingList from "@/components/MappingList.vue"
import { useServerStore } from "@/stores/server"
import { useNotify } from "@/composables/useNotify"

const PAGE_SIZE = 20

const listComponents = {
  items: ItemList,
  mappings: MappingList,
}

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  selectedUri: {
    type: String,
    default: null,
  },
  // Currently selected record, used to highlight its row in the flat lists.
  selectedRecord: {
    type: Object,
    default: null,
  },
  // URI of the scheme to browse concepts in, mirrored from the route (?scheme=).
  schemeUri: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(["select", "scheme-change", "page-change"])

const store = useServerStore()
const { notify } = useNotify()

const items = ref([])
const totalCount = ref(null)
const isLoading = ref(false)
const page = ref(1)

const rangeStart = computed(() =>
  items.value.length ? (page.value - 1) * PAGE_SIZE + 1 : 0,
)
const rangeEnd = computed(
  () => (page.value - 1) * PAGE_SIZE + items.value.length,
)

const formattedTotalCount = computed(() =>
  totalCount.value != null ? totalCount.value.toLocaleString() : "",
)

const isPaginationVisible = computed(
  () =>
    !props.config.hierarchical && totalCount.value != null && !isEmpty.value,
)

const isEmpty = computed(() => {
  if (!props.config.hierarchical) {
    return !items.value.length
  }
  return !schemes.value.length || !topConcepts.value.length
})

const emptyMessage = computed(() => {
  if (!props.config.hierarchical) {
    return `This server has no ${props.config.label.toLowerCase()}.`
  }
  if (!schemes.value.length) {
    return "This server has no terminologies to browse concepts in."
  }
  return "This terminology has no concepts."
})

const schemes = ref([])
const selectedScheme = ref(null)
const topConcepts = ref([])
const conceptTreeRef = ref(null)

const highlightByUri = computed(() =>
  props.selectedUri ? { [props.selectedUri]: true } : {},
)

const selectedConcept = computed(() =>
  props.selectedUri ? { uri: props.selectedUri } : null,
)

/**
 * Finds a loaded scheme matching the given URI (canonical `uri` or any alias in
 * `identifier`), falling back to the first scheme.
 *
 * @param {?string} uri the scheme URI to resolve
 * @returns {?Object} the matching scheme, or the first scheme, or null
 */
function resolveScheme(uri) {
  if (!schemes.value.length) {
    return null
  }
  if (!uri) {
    return schemes.value[0]
  }
  const match = schemes.value.find(
    (scheme) => scheme.uri === uri || (scheme.identifier || []).includes(uri),
  )
  return match ?? schemes.value[0]
}

const schemeOptions = computed(() =>
  schemes.value.map((scheme) => ({
    value: scheme,
    text: jskos.prefLabel(scheme) || scheme.uri,
  })),
)

// Props bound to the active flat list component
const listBindings = computed(() => {
  if (props.config.listComponent === "items") {
    return {
      items: items.value,
      highlightByUri: highlightByUri.value,
      draggable: false,
    }
  }
  return {
    [props.config.listComponent]: items.value,
    selected: props.selectedRecord,
  }
})

/**
 * Loads one page of records for the current type via its configured registry
 * list method.
 */
async function fetchList() {
  const registry = store[props.config.registry]
  if (!registry || !props.config.list) {
    return
  }
  isLoading.value = true
  try {
    const result = await registry[props.config.list]({
      params: { limit: PAGE_SIZE, offset: (page.value - 1) * PAGE_SIZE },
    })
    items.value = Array.isArray(result) ? result : []
    totalCount.value = result?._totalCount ?? items.value.length
  } catch (error) {
    notify(`Could not load ${props.config.label}: ${error.message}`, "danger")
    items.value = []
    totalCount.value = null
  } finally {
    isLoading.value = false
  }
}

/**
 * Loads the available schemes for the concept scheme picker.
 */
async function fetchSchemes() {
  const registry = store[props.config.registry]
  if (!registry) {
    return
  }
  isLoading.value = true
  try {
    const result = await registry.getSchemes({ params: { limit: 500 } })
    schemes.value = Array.isArray(result) ? result : []
    selectedScheme.value = resolveScheme(props.schemeUri)
  } catch (error) {
    notify(`Could not load schemes: ${error.message}`, "danger")
    schemes.value = []
  } finally {
    isLoading.value = false
  }
}

/**
 * Loads the top concepts of the currently selected scheme.
 */
async function fetchTopConcepts() {
  const registry = store[props.config.registry]
  if (!registry?.getTop || !selectedScheme.value?.uri) {
    topConcepts.value = []
    return
  }
  isLoading.value = true
  try {
    const result = await registry.getTop({ scheme: selectedScheme.value })
    topConcepts.value = jskos.sortConcepts(Array.isArray(result) ? result : [])
  } catch (error) {
    notify(`Could not load concepts: ${error.message}`, "danger")
    topConcepts.value = []
  } finally {
    isLoading.value = false
  }
}

/**
 * Opens the hierarchy path to the currently selected concept and scrolls to it.
 */
async function navigateToSelected() {
  if (!props.config.hierarchical || !props.selectedUri) {
    return
  }
  await nextTick()
  conceptTreeRef.value?.navigateToUri?.(props.selectedUri, { select: false })
}

/**
 * Resets the list state and loads the current type: schemes for hierarchical
 * types (concept browsing), or the first page of records otherwise.
 */
function load() {
  items.value = []
  totalCount.value = null
  topConcepts.value = []
  page.value = 1
  if (props.config.hierarchical) {
    fetchSchemes()
  } else {
    fetchList()
  }
}

/**
 * Handles a scheme picked in the dropdown: applies it locally and reports the
 * change so the route (?scheme=) becomes the source of truth.
 *
 * @param {Object} scheme the newly selected scheme
 */
function onSchemeChange(scheme) {
  selectedScheme.value = scheme
  emit("scheme-change", scheme?.uri ?? null)
}

/**
 * Handles a page change from the pagination control.
 *
 * @param {number} newPage the 1-based page to load
 */
function goToPage(newPage) {
  page.value = newPage
  emit("page-change")
  fetchList()
}

watch(
  () => [props.config, store[props.config.registry]],
  () => load(),
  { immediate: true },
)

// Keep the selected scheme in sync when the route (?scheme=) changes
watch(
  () => props.schemeUri,
  (uri) => {
    if (!schemes.value.length) {
      return
    }
    const resolved = resolveScheme(uri)
    if (resolved?.uri !== selectedScheme.value?.uri) {
      selectedScheme.value = resolved
    }
  },
)

// Reload the concept tree whenever the selected scheme changes
watch(selectedScheme, async () => {
  if (!props.config.hierarchical) {
    return
  }
  await fetchTopConcepts()
  await navigateToSelected()
})

// Reveal a concept that becomes selected while the tree is already mounted
watch(() => props.selectedUri, navigateToSelected)

/**
 * Forwards a ConceptTree selection, normalized to `{ record }`.
 *
 * @param {{ item: Object }} payload the selected concept
 */
function onTreeSelect({ item }) {
  emit("select", { record: item })
}

/**
 * Normalizes a selection from any flat list component into `{ record }`
 *
 * @param {{ item?: Object, mapping?: Object }} payload the selected record
 */
function onFlatSelect(payload) {
  emit("select", {
    record: payload.item ?? payload.mapping,
  })
}
</script>

<template>
  <div class="browse-list">
    <div v-if="config.hierarchical && schemes.length" class="mb-3">
      <BFormSelect
        :model-value="selectedScheme"
        :options="schemeOptions"
        :disabled="isLoading"
        @update:model-value="onSchemeChange"
      />
    </div>

    <div class="browse-list-scroll">
      <div
        v-if="isLoading"
        class="d-flex align-items-center justify-content-center h-100"
      >
        <BSpinner small />
      </div>

      <template v-else>
        <p
          v-if="isEmpty"
          class="browse-list-empty text-muted text-center py-5 mb-0"
        >
          {{ emptyMessage }}
        </p>

        <ConceptTree
          v-else-if="config.hierarchical"
          ref="conceptTreeRef"
          :key="selectedScheme?.uri"
          :model-value="selectedConcept"
          :registry="store[config.registry]"
          :scheme="selectedScheme"
          :concepts="topConcepts"
          @select="onTreeSelect"
        />

        <component
          :is="listComponents[config.listComponent]"
          v-else
          v-bind="listBindings"
          @select="onFlatSelect"
        />
      </template>
    </div>

    <div
      v-if="isPaginationVisible"
      class="browse-list-pagination d-flex flex-wrap align-items-center justify-content-between gap-2"
    >
      <div class="browse-list-count text-muted small">
        Showing {{ rangeStart }}–{{ rangeEnd }} of {{ formattedTotalCount }}
      </div>
      <BPagination
        v-if="totalCount > PAGE_SIZE"
        :model-value="page"
        :total-rows="totalCount"
        :per-page="PAGE_SIZE"
        size="sm"
        :limit="5"
        class="mb-0"
        @update:model-value="goToPage"
      />
    </div>
  </div>
</template>
