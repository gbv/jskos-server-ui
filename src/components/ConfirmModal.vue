<script setup>
/**
 * A modal dialog that asks the user to confirm an action before it happens.
 */
import { BModal } from "bootstrap-vue-next"

defineProps({
  title: {
    type: String,
    default: "Confirm",
  },
  confirmLabel: {
    type: String,
    default: "Confirm",
  },
  confirmVariant: {
    type: String,
    default: "danger",
  },
})

const emit = defineEmits(["confirm"])

const isVisible = defineModel({ type: Boolean, default: false })
</script>

<template>
  <BModal
    v-model="isVisible"
    :title="title"
    :ok-title="confirmLabel"
    :ok-variant="confirmVariant"
    cancel-variant="secondary"
    @ok="emit('confirm')"
  >
    <slot />
  </BModal>
</template>
