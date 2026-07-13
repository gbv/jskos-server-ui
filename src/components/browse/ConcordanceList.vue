<script setup>
import { computed } from "vue"
import { ItemName, Arrow } from "jskos-vue"

/**
 * A list of JSKOS concordances: source scheme, arrow, and target scheme.
 */
const props = defineProps({
  concordances: {
    type: Array,
    required: true,
  },
  itemNameOptions: {
    type: Object,
    default: () => ({}),
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
 * Stable v-for key for a concordance, falling back to its index.
 * @param {!Object} concordance The JSKOS concordance.
 * @param {number} index The concordance's position in the list.
 * @return {string} A key usable for v-for.
 */
function concordanceKey(concordance, index) {
  return (
    concordance.uri || concordance.identifier?.[0] || `concordance-${index}`
  )
}

const rows = computed(() =>
  props.concordances.map((concordance, index) => ({
    key: concordanceKey(concordance, index),
    concordance,
    fromScheme: concordance.fromScheme,
    toScheme: concordance.toScheme,
  })),
)

/**
 * Emits "select" for a clicked concordance when rowMode is enabled.
 * @param {!Object} concordance The clicked concordance.
 */
function onSelect(concordance) {
  if (props.rowMode) {
    emit("select", { concordance })
  }
}
</script>

<template>
  <ul class="jskos-vue-concordanceList">
    <li
      v-for="row in rows"
      :key="row.key"
      class="jskos-vue-concordanceList-row"
      :class="{
        'jskos-vue-clickable': rowMode,
        'jskos-vue-concordanceList-row-selected': row.concordance === selected,
      }"
      @click="onSelect(row.concordance)"
    >
      <div
        class="jskos-vue-concordanceList-side jskos-vue-concordanceList-from"
      >
        <ItemName
          v-if="row.fromScheme"
          :item="row.fromScheme"
          v-bind="itemNameOptions"
        />
        <span v-else class="jskos-vue-concordanceList-empty">&mdash;</span>
      </div>

      <div class="jskos-vue-concordanceList-arrow">
        <Arrow direction="right" />
      </div>

      <div class="jskos-vue-concordanceList-side jskos-vue-concordanceList-to">
        <ItemName
          v-if="row.toScheme"
          :item="row.toScheme"
          v-bind="itemNameOptions"
        />
        <span v-else class="jskos-vue-concordanceList-empty">&mdash;</span>
      </div>
    </li>
  </ul>
</template>

<style>
.jskos-vue-concordanceList {
  list-style: none;
  margin: 0;
  padding: 0;
}
.jskos-vue-concordanceList-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
}
.jskos-vue-concordanceList-row.jskos-vue-clickable {
  cursor: pointer;
}
.jskos-vue-concordanceList-row.jskos-vue-clickable:hover {
  background-color: var(
    --jskos-vue-concordanceList-hover-bgColor,
    var(--jskos-vue-itemList-hover-bgColor, rgba(0, 0, 0, 0.05))
  );
}
/* Selected row keeps its color even while hovered, so it stays distinguishable. */
.jskos-vue-concordanceList-row-selected,
.jskos-vue-concordanceList-row-selected.jskos-vue-clickable:hover {
  background-color: var(
    --jskos-vue-concordanceList-selected-bgColor,
    var(--jskos-vue-itemList-hover-bgColor, rgba(0, 0, 0, 0.05))
  );
}
.jskos-vue-concordanceList-side {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.jskos-vue-concordanceList-from {
  align-items: flex-end;
  text-align: right;
}
.jskos-vue-concordanceList-to {
  align-items: flex-start;
  text-align: left;
}
.jskos-vue-concordanceList-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--jskos-vue-concordanceList-arrow-color, #6c757d);
}
.jskos-vue-concordanceList-empty {
  color: var(--jskos-vue-concordanceList-empty-color, #6c757d);
}
</style>
