<script setup>
import { computed } from "vue"
import { annotationBodyText } from "@/utils/annotations"

/**
 * A list of W3C/JSKOS annotations: motivation, body value, and creator.
 */
const props = defineProps({
  annotations: {
    type: Array,
    required: true,
  },
  rowMode: {
    type: Boolean,
    default: true,
  },
  selected: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["select"])

/**
 * Stable v-for key for an annotation, falling back to its index.
 * @param {!Object} annotation The JSKOS annotation.
 * @param {number} index The annotation's position in the list.
 * @return {string} A key usable for v-for.
 */
function annotationKey(annotation, index) {
  return annotation.id || `annotation-${index}`
}

const rows = computed(() =>
  props.annotations.map((annotation, index) => ({
    key: annotationKey(annotation, index),
    annotation,
    motivation: annotation.motivation || "",
    body: annotationBodyText(annotation),
  })),
)

/**
 * Emits "select" for a clicked annotation when rowMode is enabled.
 * @param {!Object} annotation The clicked annotation.
 */
function onSelect(annotation) {
  if (props.rowMode) {
    emit("select", { annotation })
  }
}
</script>

<template>
  <ul class="jskos-vue-annotationList">
    <li
      v-for="row in rows"
      :key="row.key"
      class="jskos-vue-annotationList-row"
      :class="{
        'jskos-vue-clickable': rowMode,
        'jskos-vue-annotationList-row-selected': row.annotation === selected,
      }"
      @click="onSelect(row.annotation)"
    >
      <span class="jskos-vue-annotationList-motivation-cell">
        <span v-if="row.motivation" class="jskos-vue-annotationList-motivation">
          {{ row.motivation }}
        </span>
      </span>
      <span v-if="row.body" class="jskos-vue-annotationList-body">
        {{ row.body }}
      </span>
    </li>
  </ul>
</template>

<style>
.jskos-vue-annotationList {
  list-style: none;
  margin: 0;
  padding: 0;
}
.jskos-vue-annotationList-row {
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
}
.jskos-vue-annotationList-row.jskos-vue-clickable {
  cursor: pointer;
}
.jskos-vue-annotationList-row.jskos-vue-clickable:hover {
  background-color: var(
    --jskos-vue-annotationList-hover-bgColor,
    var(--jskos-vue-itemList-hover-bgColor, rgba(0, 0, 0, 0.05))
  );
}
.jskos-vue-annotationList-row-selected,
.jskos-vue-annotationList-row-selected.jskos-vue-clickable:hover {
  background-color: var(
    --jskos-vue-annotationList-selected-bgColor,
    var(--jskos-vue-itemList-hover-bgColor, rgba(0, 0, 0, 0.05))
  );
}
.jskos-vue-annotationList-motivation {
  display: inline-flex;
  align-items: center;
  padding: 0 0.4em;
  font-size: 0.8em;
  font-weight: bold;
  line-height: 1.6;
  border-radius: 4px;
  background-color: var(
    --jskos-vue-annotationList-motivation-bgColor,
    rgba(0, 0, 0, 0.06)
  );
  color: var(--jskos-vue-annotationList-motivation-color, #495057);
  white-space: nowrap;
}
.jskos-vue-annotationList-body {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
