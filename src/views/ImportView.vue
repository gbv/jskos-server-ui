<script setup>
import { computed, ref, useTemplateRef, watch } from "vue"
import {
  BButton,
  BFormCheckbox,
  BFormSelect,
  BSpinner,
} from "bootstrap-vue-next"
import IconBoxArrowInRight from "~icons/bi/box-arrow-in-right"
import IconExclamationCircleFill from "~icons/bi/exclamation-circle-fill"
import IconExclamationTriangleFill from "~icons/bi/exclamation-triangle-fill"
import IconLockFill from "~icons/bi/lock-fill"
import IconPlug from "~icons/bi/plug"
import IconShieldExclamation from "~icons/bi/shield-exclamation"
import IconUpload from "~icons/bi/upload"
import { useServerStore } from "@/stores/server"
import { useAuth } from "@/composables/useAuth"
import { useImport } from "@/composables/useImport"
import { IMPORTABLE_TYPES } from "@/utils/import"
import { importTypeOptionLabel } from "@/utils/importMessages"
import { getObjectType } from "@/utils/objectTypes"
import ViewTitle from "@/components/ViewTitle.vue"
import EmptyState from "@/components/EmptyState.vue"
import ImportDropzone from "@/components/import/ImportDropzone.vue"
import ImportUrlInput from "@/components/import/ImportUrlInput.vue"
import ImportSourceSummary from "@/components/import/ImportSourceSummary.vue"
import ImportOptionRow from "@/components/import/ImportOptionRow.vue"
import ImportNote from "@/components/import/ImportNote.vue"
import ImportSuccess from "@/components/import/ImportSuccess.vue"

const store = useServerStore()
const { isLoginConnected, signIn } = useAuth()
const {
  source,
  isBulk,
  selectedType,
  canImport,
  typeAccess,
  unavailableReason,
  blockedReason,
  hasTypeMismatch,
  isUploading,
  result,
  addFile,
  addUrl,
  reset,
  reportRejectedFile,
  reportMultipleFiles,
  cancelImport,
  startImport,
} = useImport()

const typeSelect = useTemplateRef("typeSelect")

const typeOptions = computed(() =>
  IMPORTABLE_TYPES.map((type) => ({
    value: type,
    text: importTypeOptionLabel(
      getObjectType(type).label,
      typeAccess.value[type],
    ),
    disabled: typeAccess.value[type] !== "open",
  })),
)

const isTypeBlocked = computed(() =>
  Boolean(selectedType.value && blockedReason.value),
)

const hasTypeError = ref(false)
watch(selectedType, () => {
  hasTypeError.value = false
})

const hasPendingTypeMismatch = computed(
  () => hasTypeMismatch.value && canImport.value,
)

const typeDescribedBy = computed(
  () =>
    [
      hasTypeError.value ? "import-type-required" : null,
      isTypeBlocked.value ? "import-type-blocked" : null,
      hasPendingTypeMismatch.value ? "import-type-mismatch" : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined,
)

/**
 * Starts the import, or marks the type field when it has no type yet.
 */
function onImport() {
  if (!selectedType.value) {
    hasTypeError.value = true
    typeSelect.value?.element?.focus()
    return
  }
  startImport()
}

const canSignIn = computed(
  () =>
    unavailableReason.value?.access === "auth-required" &&
    Boolean(isLoginConnected.value),
)

const canSignInForType = computed(
  () =>
    isTypeBlocked.value &&
    typeAccess.value[selectedType.value] === "auth-required" &&
    Boolean(isLoginConnected.value),
)
</script>

<template>
  <EmptyState v-if="!store.activeUrl" class="not-connected">
    <template #icon><IconPlug aria-hidden="true" /></template>
    No server connected.
    <router-link to="/connection">Connect to a jskos-server</router-link>
    to import data.
  </EmptyState>

  <div v-else class="import-view mx-auto">
    <ViewTitle>Import</ViewTitle>

    <EmptyState
      v-if="unavailableReason"
      class="import-unavailable"
      :title="unavailableReason.title"
    >
      <template #icon><IconShieldExclamation aria-hidden="true" /></template>
      {{ unavailableReason.text }}
      <template v-if="canSignIn" #actions>
        <BButton
          variant="primary"
          class="d-inline-flex align-items-center gap-2"
          @click="signIn"
        >
          <IconBoxArrowInRight aria-hidden="true" />
          Sign in
        </BButton>
      </template>
    </EmptyState>

    <ImportSuccess
      v-else-if="result"
      :result="result"
      :source-name="source.name"
      :is-bulk="isBulk"
      @restart="reset"
    />

    <template v-else>
      <section>
        <h2 class="import-step-title section-label">Select source</h2>
        <ImportDropzone
          :disabled="isUploading"
          @add="addFile"
          @reject="reportRejectedFile"
          @reject-multiple="reportMultipleFiles"
        />
        <div class="import-or-divider my-3"><span>or</span></div>
        <ImportUrlInput :disabled="isUploading" @add="addUrl" />
      </section>

      <template v-if="source">
        <hr class="import-step-rule" />

        <section>
          <h2 class="import-step-title section-label">Source</h2>
          <ImportSourceSummary :source="source" />
        </section>

        <hr class="import-step-rule" />

        <section>
          <h2 class="import-step-title section-label">Options</h2>
          <div class="import-options border rounded">
            <ImportOptionRow label="Content type" label-for="import-type">
              <template #description>
                The source is imported as this type.
              </template>
              <BFormSelect
                id="import-type"
                ref="typeSelect"
                v-model="selectedType"
                :options="typeOptions"
                :disabled="isUploading"
                :state="hasTypeError ? false : null"
                :aria-describedby="typeDescribedBy"
              >
                <template #first>
                  <option :value="null" disabled>-- Select type --</option>
                </template>
              </BFormSelect>
              <template #notices>
                <ImportNote
                  v-if="hasTypeError"
                  id="import-type-required"
                  :icon="IconExclamationCircleFill"
                  variant="danger"
                >
                  {{ blockedReason }}
                </ImportNote>
                <ImportNote
                  v-if="isTypeBlocked"
                  id="import-type-blocked"
                  :icon="IconLockFill"
                >
                  {{ blockedReason }}
                  <BButton
                    v-if="canSignInForType"
                    variant="link"
                    class="import-note-action"
                    @click="signIn"
                  >
                    Sign in
                  </BButton>
                </ImportNote>
                <ImportNote
                  v-if="hasPendingTypeMismatch"
                  id="import-type-mismatch"
                  :icon="IconExclamationTriangleFill"
                >
                  The data looks like a different content type than the one
                  selected.
                </ImportNote>
              </template>
            </ImportOptionRow>

            <ImportOptionRow label="Bulk mode" label-for="import-bulk">
              <template #description>
                Skips invalid entries instead of failing the whole import, and
                replaces records with the same URI instead of merging them.
              </template>
              <BFormCheckbox
                id="import-bulk"
                v-model="isBulk"
                :disabled="isUploading"
                class="import-option-switch"
                switch
              />
            </ImportOptionRow>
          </div>
        </section>

        <hr class="import-step-rule" />

        <div class="d-grid gap-2 d-md-flex align-items-md-center gap-md-3">
          <BButton
            variant="primary"
            size="lg"
            class="import-submit d-inline-flex align-items-center justify-content-center gap-2"
            :disabled="isUploading || !canImport || isTypeBlocked"
            @click="onImport"
          >
            <BSpinner v-if="isUploading" small />
            <IconUpload v-else aria-hidden="true" />
            Import
          </BButton>
          <BButton
            v-if="isUploading"
            variant="outline-secondary"
            size="lg"
            @click="cancelImport"
          >
            Cancel
          </BButton>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.import-view {
  max-width: 46rem;
}

.import-or-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--bs-secondary-color);
  font-size: 0.875rem;
  text-transform: uppercase;
}

.import-or-divider::before,
.import-or-divider::after {
  content: "";
  flex: 1 1 auto;
  border-top: 1px solid var(--bs-border-color);
}

.import-step-title {
  margin-bottom: 0.75rem;
}

.import-step-rule {
  margin: 2rem 0;
}

.import-option-switch {
  font-size: 1.25rem;
}

.import-note-action {
  padding: 0;
  border: 0;
  font-size: inherit;
  vertical-align: baseline;
}

.import-unavailable {
  --empty-state-icon-color: var(--bs-warning-text-emphasis);
}

@media (min-width: 768px) {
  .import-submit {
    min-width: 14rem;
  }
}
</style>
