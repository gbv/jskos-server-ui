<script setup>
defineProps({
  icon: {
    type: [Object, Function],
    required: true,
  },
  variant: {
    type: String,
    default: "warning",
    validator: (value) => ["warning", "danger"].includes(value),
  },
})
</script>

<template>
  <p class="import-note" :class="`import-note-${variant}`">
    <component :is="icon" class="import-note-icon" aria-hidden="true" />
    <span><slot /></span>
  </p>
</template>

<style scoped>
.import-note {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0;
  font-size: 0.875rem;
  color: var(--import-note-color);
}

.import-note-warning {
  --import-note-color: var(--bs-warning-text-emphasis);
}

.import-note-danger {
  --import-note-color: var(--bs-danger-text-emphasis);
}

.import-note-icon {
  flex-shrink: 0;
  margin-top: 0.2em;
}
</style>
