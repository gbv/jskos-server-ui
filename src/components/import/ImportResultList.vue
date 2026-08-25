<script setup>
import { computed, ref } from "vue"
import { ItemName } from "jskos-vue"
import IconArrowRightCircle from "~icons/bi/arrow-right-circle"
import IconBraces from "~icons/bi/braces"
import IconCardText from "~icons/bi/card-text"
import { useServerStore } from "@/stores/server"
import { resolveRecordRoute } from "@/utils/objectTypes"
import { recordLabel, resolveDataUrl } from "@/utils/import"
import { formatCount } from "@/utils/format"
import { getDetailComponent } from "@/components/browse/detailComponents"
import RecordDetailModal from "@/components/browse/RecordDetailModal.vue"

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  isBulk: {
    type: Boolean,
    default: false,
  },
})

const store = useServerStore()

const entries = computed(() =>
  props.result.records.map((record) => ({
    record,
    label: recordLabel(record),
    dataUrl: store.activeUrl
      ? resolveDataUrl(store.activeUrl, record.uri || record.id)
      : null,
    browseRoute: resolveRecordRoute(props.result.type, record),
  })),
)

const remainingCount = computed(
  () => props.result.count - props.result.records.length,
)

/**
 * Whether a record can be looked at without leaving the view. A bulk import
 * reports URIs only, leaving nothing for the modal to show.
 */
const hasDetails = computed(
  () => !props.isBulk && Boolean(getDetailComponent(props.result.type)),
)

const detailRecord = ref(null)
const isDetailVisible = ref(false)

/**
 * Opens the detail modal for one of the imported records.
 *
 * @param {!Object} record The record to show.
 */
function showDetails(record) {
  detailRecord.value = record
  isDetailVisible.value = true
}
</script>

<template>
  <div class="import-result">
    <h3 class="import-result-title section-label">
      Records ({{ formatCount(result.count) }})
    </h3>
    <ul class="import-result-list list-unstyled mb-0">
      <li
        v-for="entry in entries"
        :key="entry.record.uri"
        class="import-result-entry"
      >
        <span
          class="import-result-name text-truncate"
          :title="entry.record.uri"
        >
          <ItemName
            v-if="entry.label"
            :item="entry.record"
            :draggable="false"
          />
          <span v-else class="import-result-uri">{{ entry.record.uri }}</span>
        </span>
        <span class="import-result-actions">
          <button
            v-if="hasDetails"
            type="button"
            class="import-result-action"
            @click="showDetails(entry.record)"
          >
            <IconCardText aria-hidden="true" />
            Details
          </button>
          <RouterLink
            v-if="entry.browseRoute"
            :to="entry.browseRoute"
            class="import-result-action"
            title="Show this record in the browse view"
          >
            <IconArrowRightCircle aria-hidden="true" />
            Browse
          </RouterLink>
          <a
            v-if="entry.dataUrl"
            :href="entry.dataUrl"
            target="_blank"
            rel="noopener"
            class="import-result-action"
            title="Open the stored JSKOS data in a new tab"
          >
            <IconBraces aria-hidden="true" />
            JSON
          </a>
        </span>
      </li>
    </ul>
    <p v-if="remainingCount > 0" class="import-result-more mb-0">
      and {{ formatCount(remainingCount) }} more
    </p>
    <p v-if="isBulk" class="import-result-note mb-0">
      A bulk import reports the URIs of stored records only, and skips invalid
      entries. The count above is what the server actually stored.
    </p>

    <RecordDetailModal
      v-if="hasDetails"
      v-model="isDetailVisible"
      :type="result.type"
      :record="detailRecord"
    />
  </div>
</template>

<style scoped>
.import-result {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--bs-border-color);
}

.import-result-title {
  margin-bottom: 0.5rem;
}

.import-result-list {
  margin-inline: -0.5rem;
}

.import-result-entry {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.35rem 0.5rem;
  border-radius: var(--bs-border-radius-sm);
}

.import-result-entry:hover {
  background-color: var(--bs-secondary-bg);
}

.import-result-name {
  min-width: 0;
}

.import-result-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  margin-left: auto;
}

.import-result-action {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0;
  border: 0;
  background: none;
  font-size: 0.875rem;
  color: var(--bs-link-color);
  text-decoration: none;
}

.import-result-action:hover {
  color: var(--bs-link-hover-color);
  text-decoration: underline;
}

.import-result-uri {
  font-family: var(--bs-font-monospace);
  font-size: 0.875rem;
  color: var(--bs-secondary-color);
}

.import-result-more,
.import-result-note {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--bs-secondary-color);
}
</style>
