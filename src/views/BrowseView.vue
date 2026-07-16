<script setup>
import { ref, computed, watch } from "vue"
import { BButton } from "bootstrap-vue-next"
import IconArrowLeft from "~icons/bi/arrow-left"
import IconLockFill from "~icons/bi/lock-fill"
import { useRoute, useRouter } from "vue-router"
import { useServerStore } from "@/stores/server"
import { useAuth } from "@/composables/useAuth"
import { getBrowseType } from "@/utils/browseTypes"
import { useBrowseItemDetail } from "@/composables/useBrowseItemDetail"
import ViewTitle from "@/components/ViewTitle.vue"
import BrowseList from "@/components/browse/BrowseList.vue"
import BrowseDetail from "@/components/browse/BrowseDetail.vue"
import MappingDetail from "@/components/browse/MappingDetail.vue"
import ConcordanceDetail from "@/components/browse/ConcordanceDetail.vue"
import AnnotationDetail from "@/components/browse/AnnotationDetail.vue"

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
})

const store = useServerStore()
const { loggedIn } = useAuth()
const route = useRoute()
const router = useRouter()

const config = computed(() => getBrowseType(props.type))

// Keyed by config.detailComponent, which is also the component's record prop name.
const detailComponents = {
  item: BrowseDetail,
  mapping: MappingDetail,
  concordance: ConcordanceDetail,
  annotation: AnnotationDetail,
}

const { loadDetail, resolveConceptHierarchy } = useBrowseItemDetail(
  config,
  store,
)

const isSupported = computed(
  () => config.value && store.isSupported(config.value.capability, "read"),
)

const canRead = computed(() => {
  if (!config.value) {
    return false
  }
  if (!store.requiresAuth(config.value.capability, "read")) {
    return true
  }
  return store.isAuthorizedFor(config.value.capability, "read")
})

const selectedItem = ref(null)
const selectedMemoryRecord = ref(null)
const selectedUri = computed(() => route.query.uri ?? null)
const selectedSchemeUri = computed(() => route.query.scheme ?? null)

const detailComponent = computed(() =>
  config.value?.detailComponent
    ? detailComponents[config.value.detailComponent]
    : null,
)
const hasDetailPane = computed(() => !!detailComponent.value)

const selectedRecord = computed(() =>
  config.value?.selection === "url"
    ? selectedItem.value
    : selectedMemoryRecord.value,
)
const hasSelection = computed(() => !!selectedRecord.value)

const detailProps = computed(() =>
  config.value?.detailComponent
    ? { [config.value.detailComponent]: selectedRecord.value }
    : {},
)

/**
 * Reflects the selected item URI in the route query, or removes it when falsy.
 *
 * @param {?string} uri the selected item URI, or a falsy value to clear it
 */
function setUri(uri) {
  router.replace({ query: { ...route.query, uri: uri || undefined } })
}

/**
 * Reflects the chosen concept scheme in the route. Switching schemes drops the
 * selected concept, which belongs to the previous scheme.
 *
 * @param {?string} schemeUri the newly selected scheme URI
 */
function onSchemeChange(schemeUri) {
  router.replace({
    query: { ...route.query, scheme: schemeUri || undefined, uri: undefined },
  })
}

/**
 * Handles a selection from the list or detail pane, normalized to `{ record }`.
 * URL-selected types mirror it in the route; memory types keep it in memory.
 *
 * @param {{ record: Object }} payload the selected record
 */
function onSelect({ record }) {
  if (config.value?.selection === "url") {
    selectedItem.value = record
    setUri(record?.uri)
    return
  }
  selectedMemoryRecord.value = record
}

/**
 * Clears the current selection: drops the in-memory record and, for URL-selected
 * types, removes the URI from the route.
 */
function clearSelection() {
  selectedMemoryRecord.value = null
  if (config.value?.selection === "url") {
    setUri(undefined)
  }
}

watch(
  selectedUri,
  (uri) => {
    if (config.value?.selection !== "url") {
      return
    }
    if (!uri) {
      selectedItem.value = null
    } else if (selectedItem.value?.uri !== uri) {
      loadDetail(uri).then((record) => {
        selectedItem.value = record
      })
    }
  },
  { immediate: true },
)

// Resolve hierarchy placeholders whenever a concept enters the detail pane.
watch(selectedItem, (item) => resolveConceptHierarchy(item))

watch(
  () => props.type,
  () => {
    selectedItem.value = null
    selectedMemoryRecord.value = null
    if (route.query.uri || route.query.scheme) {
      router.replace({
        query: { ...route.query, uri: undefined, scheme: undefined },
      })
    }
  },
)
</script>

<template>
  <div
    v-if="!store.activeUrl"
    class="not-connected text-center py-5 text-muted"
  >
    No server connected.
    <router-link to="/connection">Connect to a jskos-server</router-link>
    to browse its content.
  </div>

  <div v-else-if="!config" class="text-muted py-5 text-center">
    Unknown content type.
  </div>

  <div v-else-if="!isSupported" class="text-muted py-5 text-center">
    This server does not support browsing {{ config.label }}.
  </div>

  <div v-else-if="!canRead" class="text-muted py-5 text-center">
    <IconLockFill class="text-warning me-1" />
    <template v-if="store.requiresAuth(config.capability, 'read') && !loggedIn">
      Sign in to browse {{ config.label }}.
    </template>
    <template v-else>
      You are not authorized to browse {{ config.label }}.
    </template>
  </div>

  <div v-else>
    <ViewTitle>{{ config.label }}</ViewTitle>

    <div class="row g-4">
      <div
        :class="[
          hasDetailPane ? 'col-12 col-lg-6' : 'col-12',
          { 'd-none d-lg-block': hasDetailPane && hasSelection },
        ]"
      >
        <div
          class="browse-pane browse-list-pane browse-pane-body"
          :class="{ 'browse-list-pane-active': hasSelection }"
        >
          <BrowseList
            :config="config"
            :selected-uri="selectedUri"
            :selected-record="selectedRecord"
            :scheme-uri="selectedSchemeUri"
            @select="onSelect"
            @scheme-change="onSchemeChange"
            @page-change="clearSelection"
          />
        </div>
      </div>

      <div
        v-if="hasDetailPane"
        class="col-12 col-lg-6"
        :class="{ 'd-none d-lg-block': !hasSelection }"
      >
        <div class="browse-pane browse-detail-pane browse-pane-body">
          <BButton
            v-if="hasSelection"
            variant="secondary"
            size="sm"
            class="d-lg-none mb-2 d-inline-flex align-items-center gap-1"
            @click="clearSelection"
          >
            <IconArrowLeft aria-hidden="true" />
            Back
          </BButton>
          <component
            :is="detailComponent"
            v-if="hasSelection"
            v-bind="detailProps"
            @select="onSelect"
          />
          <p v-else class="text-muted py-4 text-center">
            Select an entry to see its details.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
