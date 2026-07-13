<script setup>
import { computed } from "vue"
import * as jskos from "jskos-tools"
import { AutoLink, utils } from "jskos-vue"
import { annotationBodyText } from "@/utils/annotations"

/**
 * Detail view for a single JSKOS annotation: motivation, body, target,
 * creator, timestamp and identifier.
 */
const props = defineProps({
  annotation: {
    type: Object,
    default: null,
  },
  language: {
    type: String,
    default: "",
  },
})

const resolvedLanguage = computed(() => props.language || undefined)

const details = computed(() => {
  const annotation = props.annotation
  if (!annotation) {
    return null
  }
  const targets = (
    Array.isArray(annotation.target) ? annotation.target : [annotation.target]
  )
    .map((target) =>
      typeof target === "string" ? target : target?.id || target?.uri,
    )
    .filter(Boolean)
  return {
    motivation: annotation.motivation || "",
    body: annotationBodyText(annotation),
    targets,
    creatorName: jskos.annotationCreatorName(annotation),
    creatorUri: jskos.annotationCreatorUri(annotation),
    created: annotation.created || null,
    modified: annotation.modified || null,
    id: annotation.id || null,
  }
})

/**
 * Formats a JSKOS date string, falling back to the raw value.
 * @param {string} value An ISO date string.
 * @return {string} A localized date string.
 */
function formatDate(value) {
  return utils.dateToString(value, resolvedLanguage.value) || value
}
</script>

<template>
  <div v-if="details" class="jskos-vue-annotationDetail">
    <div class="jskos-vue-annotationDetail-header">
      <span
        v-if="details.motivation"
        class="jskos-vue-annotationDetail-motivation"
      >
        {{ details.motivation }}
      </span>
      <span v-if="details.body" class="jskos-vue-annotationDetail-body">
        {{ details.body }}
      </span>
    </div>

    <dl class="jskos-vue-annotationDetail-fields">
      <template v-if="details.targets.length">
        <dt>Target</dt>
        <dd>
          <ul class="jskos-vue-annotationDetail-list">
            <li v-for="target in details.targets" :key="target">
              <AutoLink :href="target" />
            </li>
          </ul>
        </dd>
      </template>

      <template v-if="details.creatorName || details.creatorUri">
        <dt>Creator</dt>
        <dd>
          <AutoLink
            v-if="details.creatorUri"
            :href="details.creatorUri"
            :text="details.creatorName || details.creatorUri"
          />
          <template v-else>{{ details.creatorName }}</template>
        </dd>
      </template>

      <template v-if="details.created">
        <dt>Created</dt>
        <dd>{{ formatDate(details.created) }}</dd>
      </template>

      <template v-if="details.modified">
        <dt>Modified</dt>
        <dd>{{ formatDate(details.modified) }}</dd>
      </template>

      <template v-if="details.id">
        <dt>Identifier</dt>
        <dd><AutoLink :href="details.id" /></dd>
      </template>
    </dl>
  </div>
</template>

<style>
.jskos-vue-annotationDetail-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.25rem 0 0.75rem;
}
.jskos-vue-annotationDetail-motivation {
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
.jskos-vue-annotationDetail-body {
  min-width: 0;
  overflow-wrap: anywhere;
}
.jskos-vue-annotationDetail-fields {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0;
  font-size: 0.9em;
}
.jskos-vue-annotationDetail-fields dt {
  font-weight: bold;
}
.jskos-vue-annotationDetail-fields dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
.jskos-vue-annotationDetail-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
