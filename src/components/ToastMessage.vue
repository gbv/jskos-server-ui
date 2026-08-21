<script setup>
import { computed } from "vue"
import IconCheckCircleFill from "~icons/bi/check-circle-fill"
import IconExclamationCircleFill from "~icons/bi/exclamation-circle-fill"
import IconExclamationTriangleFill from "~icons/bi/exclamation-triangle-fill"
import IconInfoCircleFill from "~icons/bi/info-circle-fill"

defineOptions({ inheritAttrs: false })

const props = defineProps({
  body: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: "info",
    validator: (value) =>
      ["info", "success", "warning", "danger"].includes(value),
  },
})

const icon = computed(
  () =>
    ({
      success: IconCheckCircleFill,
      warning: IconExclamationTriangleFill,
      danger: IconExclamationCircleFill,
    })[props.variant] ?? IconInfoCircleFill,
)
</script>

<template>
  <div class="toast-message">
    <component :is="icon" class="toast-message-icon" aria-hidden="true" />
    <span>{{ body }}</span>
  </div>
</template>

<style scoped>
.toast-message {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.toast-message-icon {
  flex-shrink: 0;
  margin-top: 0.15em;
  font-size: 1.125rem;
}
</style>
