<script setup>
import { ref, computed, watch } from "vue"
import { BButton } from "bootstrap-vue-next"
import { BIconArrowLeft } from "bootstrap-icons-vue"
import { useRoute, useRouter } from "vue-router"
import { useServerStore } from "@/stores/server"
import { useNotify } from "@/composables/useNotify"
import { getBrowseType } from "@/utils/browseTypes"
import ViewTitle from "@/components/ViewTitle.vue"
import BrowseList from "@/components/browse/BrowseList.vue"
import BrowseDetail from "@/components/browse/BrowseDetail.vue"

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
})

const store = useServerStore()
const route = useRoute()
const router = useRouter()
const { notify } = useNotify()

const config = computed(() => getBrowseType(props.type))

const isSupported = computed(
  () => config.value && store.isSupported(config.value.capability, "read"),
)

const selectedItem = ref(null)
const selectedUri = computed(() => route.query.uri ?? null)
const selectedSchemeUri = computed(() => route.query.scheme ?? null)

/**
 * Loads full details for a JSKOS item selected via URI (e.g. a deep link).
 * Only item types (schemes, concepts) can be resolved this way.
 *
 * @param {string} uri the item URI to resolve
 */
async function loadDetail(uri) {
  if (!uri || !config.value?.item) {
    return
  }
  const registry = store[config.value.registry]
  if (!registry) {
    return
  }
  try {
    const result =
      props.type === "concepts"
        ? await registry.getConcepts({ concepts: [{ uri }] })
        : await registry.getSchemes({ params: { uri } })
    selectedItem.value = result?.[0] ?? { uri }
  } catch (error) {
    notify(`Could not load details: ${error.message}`, "danger")
    selectedItem.value = { uri }
  }
}

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

function onListSelect({ item }) {
  selectedItem.value = item
  setUri(item?.uri)
}

function clearSelection() {
  setUri(undefined)
}

watch(
  selectedUri,
  (uri) => {
    if (!uri) {
      selectedItem.value = null
    } else if (selectedItem.value?.uri !== uri) {
      loadDetail(uri)
    }
  },
  { immediate: true },
)

watch(
  () => props.type,
  () => {
    selectedItem.value = null
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

  <div v-else>
    <ViewTitle>{{ config.label }}</ViewTitle>

    <div class="row g-4">
      <div
        class="col-12 col-lg-6"
        :class="{ 'd-none d-lg-block': selectedItem }"
      >
        <div
          class="browse-pane browse-list-pane browse-pane-body"
          :class="{ 'browse-list-pane-active': selectedItem }"
        >
          <BrowseList
            :config="config"
            :selected-uri="selectedUri"
            :scheme-uri="selectedSchemeUri"
            @select="onListSelect"
            @scheme-change="onSchemeChange"
          />
        </div>
      </div>

      <div
        class="col-12 col-lg-6"
        :class="{ 'd-none d-lg-block': !selectedItem }"
      >
        <div class="browse-pane browse-detail-pane browse-pane-body">
          <BButton
            v-if="selectedItem"
            variant="secondary"
            size="sm"
            class="d-lg-none mb-2 d-inline-flex align-items-center gap-1"
            @click="clearSelection"
          >
            <BIconArrowLeft aria-hidden="true" />
            Back
          </BButton>
          <BrowseDetail :item="selectedItem" @select="onListSelect" />
        </div>
      </div>
    </div>
  </div>
</template>
