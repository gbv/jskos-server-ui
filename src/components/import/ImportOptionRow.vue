<script setup>
import ImportOptionInfo from "@/components/import/ImportOptionInfo.vue"

defineProps({
  label: {
    type: String,
    required: true,
  },
  labelFor: {
    type: String,
    default: null,
  },
  labelId: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <div class="import-option-row">
    <div class="import-option-heading">
      <label v-if="labelFor" class="import-option-label" :for="labelFor">{{
        label
      }}</label>
      <span v-else :id="labelId" class="import-option-label">{{ label }}</span>
      <ImportOptionInfo :label="label"
        ><slot name="description"
      /></ImportOptionInfo>
    </div>
    <div class="import-option-control">
      <slot />
      <slot name="notices" />
    </div>
  </div>
</template>

<style scoped>
.import-option-row {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
}

.import-option-row + .import-option-row {
  border-top: 1px solid var(--bs-border-color);
}

@media (min-width: 768px) {
  .import-option-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 22rem);
    align-items: center;
    gap: 1.5rem;
  }
}

.import-option-heading {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.import-option-label {
  font-weight: 600;
}

.import-option-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
