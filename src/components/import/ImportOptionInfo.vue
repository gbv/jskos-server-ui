<script setup>
import { BTooltip } from "bootstrap-vue-next"
import IconInfoCircle from "~icons/bi/info-circle"

defineProps({
  label: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <BTooltip class="import-option-info" placement="top">
    <template #target>
      <button
        type="button"
        class="import-option-info-trigger"
        :aria-label="`About ${label}`"
      >
        <IconInfoCircle aria-hidden="true" />
      </button>
    </template>
    <slot />
  </BTooltip>
</template>

<style scoped>
.import-option-info-trigger {
  display: inline-flex;
  padding: 0;
  border: 0;
  background: none;
  color: var(--bs-secondary-color);
  line-height: 1;
}

.import-option-info-trigger:hover,
.import-option-info-trigger:focus-visible {
  color: var(--bs-body-color);
}
</style>
