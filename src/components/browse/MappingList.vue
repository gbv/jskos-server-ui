<script setup>
import { computed } from "vue"
import * as jskos from "jskos-tools"
import { ItemName, Arrow } from "jskos-vue"

/**
 * A list of JSKOS mappings: source concept(s), an arrow carrying the mapping
 * type, and target concept(s).
 */
const props = defineProps({
  mappings: {
    type: Array,
    required: true,
  },
  itemNameOptions: {
    type: Object,
    default: () => ({}),
  },
  showType: {
    type: Boolean,
    default: true,
  },
  rowMode: {
    type: Boolean,
    default: true,
  },
  language: {
    type: String,
    default: "",
  },
  selected: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["select"])

const resolvedLanguage = computed(() => props.language || undefined)

/**
 * Stable v-for key for a mapping, falling back to its index.
 * @param {!Object} mapping The JSKOS mapping.
 * @param {number} index The mapping's position in the list.
 * @return {string} A key usable for v-for.
 */
function mappingKey(mapping, index) {
  return mapping.uri || mapping.identifier?.[0] || `mapping-${index}`
}

/**
 * Resolves the jskos-tools mapping type descriptor for a mapping.
 * @param {!Object} mapping The JSKOS mapping.
 * @return {!Object} A jskos-tools mapping type object.
 */
function mappingType(mapping) {
  return jskos.mappingTypeByType(mapping.type)
}

/**
 * Hover title for a mapping type, else the label.
 * @param {!Object} type A jskos-tools mapping type object.
 * @param {string} label The resolved type label.
 * @return {string} The tooltip text.
 */
function mappingTypeTitle(type, label) {
  const definition = jskos.definition(type, {
    language: resolvedLanguage.value,
  })
  return definition.length ? `${label}: ${definition.join(", ")}` : label
}

/**
 * Display label for a concept scheme (notation, prefLabel, or URI).
 * @param {!Object} scheme A JSKOS concept scheme.
 * @return {string} The scheme label.
 */
function schemeLabel(scheme) {
  return (
    jskos.notation(scheme) ||
    jskos.prefLabel(scheme, { language: resolvedLanguage.value }) ||
    scheme?.uri ||
    ""
  )
}

const rows = computed(() =>
  props.mappings.map((mapping, index) => {
    const type = mappingType(mapping)
    const typeLabel =
      jskos.prefLabel(type, { language: resolvedLanguage.value }) || ""
    return {
      key: mappingKey(mapping, index),
      mapping,
      from: jskos.conceptsOfMapping(mapping, "from"),
      to: jskos.conceptsOfMapping(mapping, "to"),
      fromScheme: mapping.fromScheme || null,
      toScheme: mapping.toScheme || null,
      typeNotation: type?.notation?.[0] ?? "",
      typeLabel,
      typeTitle: typeLabel ? mappingTypeTitle(type, typeLabel) : "",
    }
  }),
)

/**
 * Emits "select" for a clicked mapping when rowMode is enabled.
 * @param {!Object} mapping The clicked mapping.
 */
function onSelect(mapping) {
  if (props.rowMode) {
    emit("select", { mapping })
  }
}
</script>

<template>
  <ul class="jskos-vue-mappingList">
    <li
      v-for="row in rows"
      :key="row.key"
      class="jskos-vue-mappingList-row"
      :class="{
        'jskos-vue-clickable': rowMode,
        'jskos-vue-mappingList-row-selected': row.mapping === selected,
      }"
      @click="onSelect(row.mapping)"
    >
      <div class="jskos-vue-mappingList-side jskos-vue-mappingList-from">
        <ItemName
          v-for="concept in row.from"
          :key="concept.uri"
          :item="concept"
          v-bind="itemNameOptions"
        />
        <span v-if="!row.from.length" class="jskos-vue-mappingList-empty">
          &mdash;
        </span>
        <span v-if="row.fromScheme" class="jskos-vue-mappingList-scheme">
          {{ schemeLabel(row.fromScheme) }}
        </span>
      </div>

      <div class="jskos-vue-mappingList-arrow" :title="row.typeTitle">
        <span
          v-if="showType && row.typeNotation"
          class="jskos-vue-mappingList-type"
          :aria-label="row.typeLabel"
        >
          {{ row.typeNotation }}
        </span>
        <Arrow v-else direction="right" />
      </div>

      <div class="jskos-vue-mappingList-side jskos-vue-mappingList-to">
        <ItemName
          v-for="concept in row.to"
          :key="concept.uri"
          :item="concept"
          v-bind="itemNameOptions"
        />
        <span v-if="!row.to.length" class="jskos-vue-mappingList-empty">
          &mdash;
        </span>
        <span v-if="row.toScheme" class="jskos-vue-mappingList-scheme">
          {{ schemeLabel(row.toScheme) }}
        </span>
      </div>
    </li>
  </ul>
</template>

<style>
.jskos-vue-mappingList {
  list-style: none;
  margin: 0;
  padding: 0;
}
.jskos-vue-mappingList-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
}
.jskos-vue-mappingList-row.jskos-vue-clickable {
  cursor: pointer;
}
.jskos-vue-mappingList-row.jskos-vue-clickable:hover {
  background-color: var(
    --jskos-vue-mappingList-hover-bgColor,
    var(--jskos-vue-itemList-hover-bgColor, rgba(0, 0, 0, 0.05))
  );
}
/* Selected row keeps its color even while hovered, so it stays distinguishable. */
.jskos-vue-mappingList-row-selected,
.jskos-vue-mappingList-row-selected.jskos-vue-clickable:hover {
  background-color: var(
    --jskos-vue-mappingList-selected-bgColor,
    var(--jskos-vue-itemList-hover-bgColor, rgba(0, 0, 0, 0.05))
  );
}
.jskos-vue-mappingList-side {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.jskos-vue-mappingList-from {
  align-items: flex-end;
  text-align: right;
}
.jskos-vue-mappingList-to {
  align-items: flex-start;
  text-align: left;
}
.jskos-vue-mappingList-scheme {
  font-size: 0.8em;
  color: var(--jskos-vue-mappingList-scheme-color, #6c757d);
}
.jskos-vue-mappingList-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--jskos-vue-mappingList-type-color, #6c757d);
}
.jskos-vue-mappingList-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6em;
  height: 1.6em;
  padding: 0 0.35em;
  font-size: 0.95em;
  font-weight: bold;
  line-height: 1;
  border-radius: 4px;
  background-color: var(
    --jskos-vue-mappingList-type-bgColor,
    rgba(0, 0, 0, 0.06)
  );
  color: var(--jskos-vue-mappingList-type-color, #495057);
}
.jskos-vue-mappingList-empty {
  color: var(--jskos-vue-mappingList-type-color, #6c757d);
}
</style>
