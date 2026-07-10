<script setup>
import { ItemDetails } from "jskos-vue"

defineProps({
  item: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["select"])

/**
 * Forwards a selection from within ItemDetails (e.g. a related concept),
 * normalized to `{ record }` so the view handles it like a list selection.
 *
 * @param {{ item: Object }} payload the selected item
 */
function onSelect({ item }) {
  emit("select", { record: item })
}
</script>

<template>
  <div class="browse-detail">
    <ItemDetails
      :item="item"
      :draggable="false"
      :dropzone="false"
      @select="onSelect"
    />
  </div>
</template>
