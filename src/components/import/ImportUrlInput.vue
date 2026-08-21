<script setup>
import { ref, computed } from "vue"
import { BButton, BFormInput, BInputGroup } from "bootstrap-vue-next"

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["add"])

const url = ref("")

const canAdd = computed(() => /^https?:\/\/\S+$/.test(url.value.trim()))

/**
 * Hands the entered URL to the queue and clears the input.
 */
function add() {
  if (!canAdd.value) {
    return
  }
  emit("add", url.value.trim())
  url.value = ""
}
</script>

<template>
  <div class="import-url-input">
    <BInputGroup>
      <BFormInput
        id="import-url"
        v-model="url"
        type="url"
        placeholder="https://example.org/vocabulary.ndjson"
        aria-label="URL for the server to fetch the data from"
        :disabled="disabled"
        @keyup.enter="add"
      />
      <BButton variant="primary" :disabled="disabled || !canAdd" @click="add">
        Select URL
      </BButton>
    </BInputGroup>
  </div>
</template>
