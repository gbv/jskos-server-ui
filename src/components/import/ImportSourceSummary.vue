<script setup>
import { computed } from "vue"
import { BBadge } from "bootstrap-vue-next"
import IconFileEarmarkText from "~icons/bi/file-earmark-text"
import IconLink from "~icons/bi/link-45deg"
import { formatByteSize } from "@/utils/format"
import { getObjectType } from "@/utils/objectTypes"
import ImportMetrics from "@/components/import/ImportMetrics.vue"

const props = defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const UNKNOWN = "—"

const metrics = computed(() => [
  { label: "Format", value: (props.source.format ?? "auto").toUpperCase() },
  { label: "Size", value: formatByteSize(props.source.size) || UNKNOWN },
])

const detectedTypeLabel = computed(() =>
  props.source.detectedType
    ? getObjectType(props.source.detectedType).label
    : "",
)
</script>

<template>
  <div class="import-source-summary border rounded p-3">
    <div class="d-flex align-items-center gap-2">
      <component
        :is="source.kind === 'url' ? IconLink : IconFileEarmarkText"
        class="text-muted flex-shrink-0"
        aria-hidden="true"
      />
      <span class="fw-medium text-break">{{ source.name }}</span>
      <BBadge
        v-if="detectedTypeLabel"
        variant="warning"
        class="ms-auto flex-shrink-0"
      >
        {{ detectedTypeLabel }}
      </BBadge>
    </div>

    <ImportMetrics class="mt-3" :metrics="metrics" />

    <p v-if="source.kind === 'url'" class="import-source-note mt-3 mb-0 small">
      The server fetches this URL itself, so its size and contents are only
      known once the import runs.
    </p>
  </div>
</template>

<style scoped>
.import-source-summary {
  background-color: var(--bs-tertiary-bg);
}

.import-source-note {
  color: var(--bs-secondary-color);
}
</style>
