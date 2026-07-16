<script setup>
import { computed } from "vue"
import { useRoute } from "vue-router"
import { BNavItemDropdown, BDropdownItem } from "bootstrap-vue-next"
import IconLockFill from "~icons/bi/lock-fill"
import { BROWSE_TYPES } from "@/utils/browseTypes"
import { useTypeAccess } from "@/composables/useTypeAccess"

const emit = defineEmits(["navigate"])

const { resolveAccess } = useTypeAccess()
const route = useRoute()

const browseRoutes = new Set(
  Object.values(BROWSE_TYPES).map((config) => config.route),
)
const isActive = computed(() => browseRoutes.has(route.path))

const items = computed(() =>
  Object.entries(BROWSE_TYPES)
    .map(([type, config]) => ({
      type,
      label: config.label,
      route: config.route,
      access: resolveAccess(type),
    }))
    .filter((item) => item.access !== "unsupported"),
)

/**
 * Returns the tooltip explaining why a locked browse entry is disabled.
 *
 * @param {{label: string, access: string}} item the browse menu item
 * @returns {?string} the tooltip text, or undefined for an open entry
 */
function lockTitle(item) {
  if (item.access === "auth-required") {
    return `Sign in to browse ${item.label}`
  }
  if (item.access === "denied") {
    return `Not authorized to browse ${item.label}`
  }
  return undefined
}
</script>

<template>
  <BNavItemDropdown
    v-if="items.length"
    text="Browse"
    :toggle-class="{ active: isActive }"
  >
    <BDropdownItem
      v-for="item in items"
      :key="item.type"
      :to="item.access === 'open' ? item.route : undefined"
      :disabled="item.access !== 'open'"
      :title="lockTitle(item)"
      class="d-flex align-items-center gap-2"
      @click="item.access === 'open' && emit('navigate')"
    >
      {{ item.label }}
      <IconLockFill
        v-if="item.access !== 'open'"
        class="ms-auto"
        :class="item.access === 'denied' ? 'text-danger' : 'text-warning'"
        aria-hidden="true"
      />
    </BDropdownItem>
  </BNavItemDropdown>
</template>
