<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
})
</script>

<template>
  <div class="empty-state text-center">
    <div v-if="$slots.icon" class="empty-state-icon">
      <slot name="icon" />
    </div>
    <h2 v-if="title" class="empty-state-title">{{ title }}</h2>
    <div class="empty-state-text">
      <slot />
    </div>
    <div v-if="$slots.actions" class="empty-state-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 3rem 1.5rem;
}

.empty-state-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 3rem;
  line-height: 1;
  color: var(--empty-state-icon-color, var(--bs-secondary-color));
  opacity: 0.65;
}

.empty-state-title {
  margin-top: 1rem;
  font-size: 1.25rem;
}

.empty-state-text {
  max-width: 28rem;
  margin-inline: auto;
  color: var(--bs-secondary-color);
}

.empty-state-actions {
  margin-top: 1.5rem;
}
</style>
