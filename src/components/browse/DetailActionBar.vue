<script setup>
import { ref, computed } from "vue"
import { BButton, BSpinner, vBTooltip } from "bootstrap-vue-next"
import IconTrash from "~icons/bi/trash"
import { useServerStore } from "@/stores/server"
import { useNotify } from "@/composables/useNotify"
import { useTypeAccess } from "@/composables/useTypeAccess"
import { getObjectType } from "@/utils/objectTypes"
import ConfirmModal from "@/components/ConfirmModal.vue"

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  record: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["deleted"])

const store = useServerStore()
const { notify } = useNotify()
const { resolveAccess } = useTypeAccess()

const config = computed(() => getObjectType(props.type))
const deleteAction = computed(() => config.value?.actions?.delete ?? null)
const deleteAccess = computed(() =>
  deleteAction.value ? resolveAccess(props.type, "delete") : "unsupported",
)
const isDeleteVisible = computed(() => deleteAccess.value !== "unsupported")
const canDelete = computed(() => deleteAccess.value === "open")

/**
 * Tooltip explaining why the delete button is locked.
 */
const lockedHint = computed(() => {
  if (deleteAccess.value === "auth-required") {
    return "Sign in to delete"
  }
  if (deleteAccess.value === "denied") {
    return "Not authorized to delete this entry"
  }
  return undefined
})

const isDeleting = ref(false)
const isConfirmVisible = ref(false)

const isConcordanceWithMappings = computed(
  () => props.type === "concordances" && Number(props.record.extent) > 0,
)

/**
 * Builds the user-facing message for a failed deletion.
 *
 * @param {Error} error the error thrown by the registry's delete method
 * @returns {string} a notification message
 */
function deleteErrorMessage(error) {
  const status = error.relatedError?.response?.status
  if (status === 401 || status === 403) {
    return "You are not authorized to delete this entry."
  }
  return `Could not delete: ${error.message}`
}

/**
 * Deletes the current record via its type's configured registry method and
 * reports the outcome.
 */
async function performDelete() {
  const registry = store[config.value.registry]
  isDeleting.value = true
  try {
    await registry[deleteAction.value.method]({
      [deleteAction.value.recordKey]: props.record,
    })
    notify("Entry deleted.", "success")
    emit("deleted", { record: props.record })
  } catch (error) {
    notify(deleteErrorMessage(error), "danger")
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div v-if="isDeleteVisible" class="detail-action-bar row g-2 mt-2">
    <!-- TODO: Add Edit button -->
    <div class="col-6 ms-auto" v-b-tooltip.body="lockedHint">
      <BButton
        variant="outline-danger"
        class="w-100 d-inline-flex align-items-center justify-content-center gap-1"
        :disabled="!canDelete || isDeleting"
        @click="isConfirmVisible = true"
      >
        <BSpinner v-if="isDeleting" small />
        <IconTrash v-else aria-hidden="true" />
        Delete
      </BButton>
    </div>

    <ConfirmModal
      v-model="isConfirmVisible"
      title="Confirm deletion"
      confirm-label="Delete"
      @confirm="performDelete"
    >
      This will permanently delete the selected entry. This cannot be undone.
      <div v-if="isConcordanceWithMappings" class="text-danger mt-2">
        This concordance still has {{ record.extent }} mappings associated with
        it; the server will refuse to delete it.
      </div>
    </ConfirmModal>
  </div>
</template>
