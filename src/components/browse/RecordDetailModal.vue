<script setup>
/**
 * A modal dialog showing a single record through the detail component of its
 * object type.
 */
import { computed } from "vue"
import { BModal } from "bootstrap-vue-next"
import * as jskos from "jskos-tools"
import { getObjectType } from "@/utils/objectTypes"
import { getDetailComponent } from "@/components/browse/detailComponents"

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  record: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["select"])

const isVisible = defineModel({ type: Boolean, default: false })

const config = computed(() => getObjectType(props.type))
const detailComponent = computed(() => getDetailComponent(props.type))
const hasDetail = computed(() => !!detailComponent.value && !!props.record)

const detailProps = computed(() =>
  hasDetail.value ? { [config.value.detailComponent]: props.record } : {},
)

// Records without a label (mappings, annotations) fall back to their type.
const title = computed(
  () =>
    jskos.prefLabel(props.record, { fallbackToUri: false }) ||
    config.value?.label ||
    "Details",
)
</script>

<template>
  <BModal v-model="isVisible" :title="title" size="lg" scrollable no-footer>
    <component
      :is="detailComponent"
      v-if="hasDetail"
      v-bind="detailProps"
      @select="emit('select', $event)"
    />
    <p v-else class="text-muted mb-0">No details available for this entry.</p>
  </BModal>
</template>
