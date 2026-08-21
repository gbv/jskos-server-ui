<script setup>
import { computed, onMounted, useTemplateRef } from "vue"
import { BBadge, BButton } from "bootstrap-vue-next"
import IconCheckCircleFill from "~icons/bi/check-circle-fill"
import IconUpload from "~icons/bi/upload"
import { getObjectType } from "@/utils/objectTypes"
import ImportResultList from "@/components/import/ImportResultList.vue"

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  sourceName: {
    type: String,
    required: true,
  },
  isBulk: {
    type: Boolean,
    default: false,
  },
})

defineEmits(["restart"])

const heading = useTemplateRef("heading")

onMounted(() => heading.value?.focus())

const typeLabel = computed(() => getObjectType(props.result.type).label)

const browseRoute = computed(
  () => getObjectType(props.result.type)?.route ?? null,
)
</script>

<template>
  <div class="import-success">
    <div class="import-success-report p-4">
      <div class="import-success-header">
        <IconCheckCircleFill class="import-success-icon" aria-hidden="true" />
        <h2 ref="heading" class="import-success-title" tabindex="-1">
          Import complete
        </h2>
      </div>

      <div class="import-success-source">
        <h3 class="import-success-source-title section-label">Source</h3>
        <p class="mb-0 d-flex align-items-center gap-2">
          <span class="text-break">{{ sourceName }}</span>
          <span class="import-success-badges ms-auto flex-shrink-0">
            <BBadge v-if="isBulk" variant="secondary">Bulk</BBadge>
            <BBadge variant="warning">{{ typeLabel }}</BBadge>
          </span>
        </p>
      </div>

      <ImportResultList :result="result" :is-bulk="isBulk" />
    </div>

    <div class="import-success-actions d-grid gap-2 d-md-flex flex-md-wrap">
      <BButton v-if="browseRoute" :to="browseRoute" variant="primary">
        Browse {{ typeLabel }}
      </BButton>
      <BButton
        variant="outline-secondary"
        class="import-success-restart d-inline-flex align-items-center justify-content-center gap-2"
        @click="$emit('restart')"
      >
        <IconUpload aria-hidden="true" />
        Import another
      </BButton>
    </div>
  </div>
</template>

<style scoped>
.import-success-report {
  background-color: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  border-left: 4px solid var(--color-success);
  border-radius: var(--bs-border-radius);
}

.import-success-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.import-success-icon {
  flex-shrink: 0;
  font-size: 1.5rem;
  color: var(--color-success);
}

.import-success-title {
  min-width: 0;
  margin-bottom: 0;
  font-size: 1.25rem;
}

.import-success-title:focus-visible {
  outline: none;
}

.import-success-source {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--bs-border-color);
}

.import-success-source-title {
  margin-bottom: 0.5rem;
}

.import-success-badges {
  display: flex;
  gap: 0.5rem;
}

.import-success-actions {
  margin-top: 1.5rem;
}
</style>
