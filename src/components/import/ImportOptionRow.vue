<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  labelFor: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="import-option-row">
    <div>
      <label class="import-option-label" :for="labelFor">{{ label }}</label>
      <p class="import-option-description"><slot name="description" /></p>
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
    align-items: start;
    gap: 1.5rem;
  }
}

.import-option-label {
  display: block;
  font-weight: 600;
}

.import-option-description {
  margin-bottom: 0;
  font-size: 0.875rem;
  color: var(--bs-secondary-color);
}

.import-option-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
