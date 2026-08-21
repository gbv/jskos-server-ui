<script setup>
import { ref, watch } from "vue"
import { BButton, BFormFile } from "bootstrap-vue-next"
import IconFileEarmarkPlus from "~icons/bi/file-earmark-plus"
import {
  ACCEPTED_FILE_TYPES,
  ACCEPTED_FILE_TYPES_HINT,
  detectFormat,
} from "@/utils/import"

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["add", "reject", "reject-multiple"])

const selected = ref(null)

/**
 * Reports drops that the file input will discard.
 *
 * @param {!DragEvent} event The native drop event.
 */
function onNativeDrop(event) {
  if (props.disabled) {
    return
  }
  const dropped = [...(event.dataTransfer?.files ?? [])]
  if (dropped.length > 1) {
    emit("reject-multiple")
    return
  }
  const [file] = dropped
  if (file && !detectFormat(file.name)) {
    emit("reject", file.name)
  }
}

watch(selected, (file) => {
  if (!file) {
    return
  }
  emit("add", file)
  selected.value = null
})
</script>

<template>
  <div class="import-dropzone" @drop.capture="onNativeDrop">
    <BFormFile
      v-model="selected"
      :accept="ACCEPTED_FILE_TYPES"
      :disabled="disabled"
      no-button
    >
      <template #placeholder>
        <div class="fs-5 fw-medium mb-3">Drop a file here or</div>
        <BButton
          variant="primary"
          class="import-dropzone-button d-inline-flex align-items-center gap-2"
          :disabled="disabled"
          aria-describedby="import-accepted-types"
        >
          <IconFileEarmarkPlus aria-hidden="true" />
          Select File
        </BButton>
        <div id="import-accepted-types" class="small text-muted mt-2">
          {{ ACCEPTED_FILE_TYPES_HINT }}
        </div>
      </template>
      <template #drop-placeholder>
        <div class="fs-5 fw-medium">Drop here</div>
      </template>
    </BFormFile>
  </div>
</template>

<style scoped>
.import-dropzone :deep(.b-form-file-control) {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
  padding: 1.5rem;
  border: 2px dashed var(--bs-border-color);
}

.import-dropzone :deep(.b-form-file-text) {
  flex: 0 0 auto;
  white-space: normal;
  overflow: visible;
  text-align: center;
}

.import-dropzone :deep(.b-form-file-drag-overlay) {
  background-color: rgba(var(--bs-body-bg-rgb), 0.95);
}

.import-dropzone :deep(.b-form-file-control:focus-within) {
  box-shadow: none;
}

.import-dropzone
  :deep(.b-form-file-control[aria-disabled="true"] .btn:disabled) {
  opacity: 1;
}

.import-dropzone-button {
  padding: 0.5rem 1.5rem;
}
</style>
