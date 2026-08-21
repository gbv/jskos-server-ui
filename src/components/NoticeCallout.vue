<script setup>
import { computed } from "vue"
import IconCheckCircleFill from "~icons/bi/check-circle-fill"
import IconExclamationCircleFill from "~icons/bi/exclamation-circle-fill"
import IconExclamationTriangleFill from "~icons/bi/exclamation-triangle-fill"

const props = defineProps({
  variant: {
    type: String,
    default: "warning",
    validator: (value) => ["warning", "danger", "success"].includes(value),
  },
  title: {
    type: String,
    default: "",
  },
})

const icon = computed(
  () =>
    ({
      danger: IconExclamationCircleFill,
      success: IconCheckCircleFill,
    })[props.variant] ?? IconExclamationTriangleFill,
)

const role = computed(() => (props.variant === "success" ? "status" : "alert"))
</script>

<template>
  <div class="notice-callout" :class="`notice-callout-${variant}`" :role="role">
    <component :is="icon" class="notice-callout-icon" aria-hidden="true" />
    <div class="notice-callout-body">
      <p v-if="title" class="notice-callout-title">{{ title }}</p>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.notice-callout {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  border-left: 4px solid var(--notice-callout-accent);
  border-radius: var(--bs-border-radius);
}

.notice-callout-warning {
  --notice-callout-accent: var(--bs-warning-text-emphasis);
}

.notice-callout-danger {
  --notice-callout-accent: var(--color-danger);
}

.notice-callout-success {
  --notice-callout-accent: var(--color-success);
}

.notice-callout-icon {
  flex-shrink: 0;
  margin-top: 0.15em;
  font-size: 1.125rem;
  color: var(--notice-callout-accent);
}

.notice-callout-body {
  min-width: 0;
}

.notice-callout-title {
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.notice-callout-body :deep(p:last-child),
.notice-callout-body :deep(ul:last-child) {
  margin-bottom: 0;
}
</style>
