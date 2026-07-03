<script setup>
import { ItemDetails } from "jskos-vue"

defineProps({
  item: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["select"])

function onSelect({ item }) {
  emit("select", { item })
}
</script>

<template>
  <div class="browse-detail">
    <div v-if="!item" class="text-muted py-4 text-center">
      Select an entry to see its details.
    </div>

    <ItemDetails
      v-else
      :item="item"
      :draggable="false"
      :dropzone="false"
      @select="onSelect"
    />
  </div>
</template>
