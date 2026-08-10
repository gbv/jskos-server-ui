<script setup>
import { computed } from "vue"
import { vBTooltip } from "bootstrap-vue-next"
import * as jskos from "jskos-tools"
import { ItemName, AutoLink, utils } from "jskos-vue"

/**
 * Detail view for a single JSKOS mapping: source/target concepts joined by the
 * mapping type, plus schemes, relevance, provenance and identifiers.
 */
const props = defineProps({
  mapping: {
    type: Object,
    default: null,
  },
  itemNameOptions: {
    type: Object,
    default: () => ({}),
  },
  language: {
    type: String,
    default: "",
  },
})

const resolvedLanguage = computed(() => props.language || undefined)

/**
 * Hover title for a mapping type: "label: definition" (Cocoda-style), else the
 * label.
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
 * Flattens a mapping's creator field into display-ready entries.
 * @param {*} creator The raw mapping.creator value.
 * @return {!Array<{label: string, uri: ?string}>} Display-ready creators.
 */
function normalizeCreators(creator) {
  if (!creator) {
    return []
  }
  const list = Array.isArray(creator) ? creator : [creator]
  return list
    .map((entry) => {
      if (typeof entry === "string") {
        return { label: entry, uri: null }
      }
      return {
        label:
          jskos.prefLabel(entry, { language: resolvedLanguage.value }) ||
          entry.uri ||
          "",
        uri: entry.uri || null,
      }
    })
    .filter((entry) => entry.label || entry.uri)
}

const details = computed(() => {
  const mapping = props.mapping
  if (!mapping) {
    return null
  }
  const type = jskos.mappingTypeByType(mapping.type)
  const typeLabel =
    jskos.prefLabel(type, { language: resolvedLanguage.value }) || ""
  return {
    from: jskos.conceptsOfMapping(mapping, "from"),
    to: jskos.conceptsOfMapping(mapping, "to"),
    fromScheme: mapping.fromScheme || null,
    toScheme: mapping.toScheme || null,
    typeNotation: type?.notation?.[0] ?? "",
    typeLabel,
    typeDefinition: jskos
      .definition(type, { language: resolvedLanguage.value })
      .join(", "),
    typeTitle: typeLabel ? mappingTypeTitle(type, typeLabel) : "",
    typeRelevance: type?.RELEVANCE ?? "",
    relevance: mapping.mappingRelevance ?? null,
    creators: normalizeCreators(mapping.creator),
    created: mapping.created || null,
    modified: mapping.modified || null,
    uri: mapping.uri || null,
    identifiers: (mapping.identifier || []).filter(Boolean),
    justification: mapping.justification || null,
    partOf: (mapping.partOf || []).filter(Boolean),
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
</script>

<template>
  <div v-if="details" class="jskos-vue-mappingDetail">
    <div class="jskos-vue-mappingDetail-relation">
      <div class="jskos-vue-mappingDetail-side jskos-vue-mappingDetail-from">
        <ItemName
          v-for="concept in details.from"
          :key="concept.uri"
          :item="concept"
          v-bind="itemNameOptions"
        />
        <span v-if="!details.from.length" class="jskos-vue-mappingDetail-empty">
          &mdash;
        </span>
        <span v-if="details.fromScheme" class="jskos-vue-mappingDetail-scheme">
          {{ schemeLabel(details.fromScheme) }}
        </span>
      </div>

      <div
        class="jskos-vue-mappingDetail-connector"
        v-b-tooltip.body="details.typeTitle"
      >
        <span
          class="jskos-vue-mappingDetail-type"
          :aria-label="details.typeLabel"
        >
          {{ details.typeNotation }}
        </span>
        <span
          v-if="details.typeLabel"
          class="jskos-vue-mappingDetail-type-label"
        >
          {{ details.typeLabel }}
        </span>
      </div>

      <div class="jskos-vue-mappingDetail-side jskos-vue-mappingDetail-to">
        <ItemName
          v-for="concept in details.to"
          :key="concept.uri"
          :item="concept"
          v-bind="itemNameOptions"
        />
        <span v-if="!details.to.length" class="jskos-vue-mappingDetail-empty">
          &mdash;
        </span>
        <span v-if="details.toScheme" class="jskos-vue-mappingDetail-scheme">
          {{ schemeLabel(details.toScheme) }}
        </span>
      </div>
    </div>

    <dl class="jskos-vue-mappingDetail-fields">
      <template v-if="details.typeLabel">
        <dt>Type</dt>
        <dd>
          {{ details.typeLabel }}
          <span
            v-if="details.typeRelevance"
            class="jskos-vue-mappingDetail-muted"
          >
            ({{ details.typeRelevance }})
          </span>
          <div
            v-if="details.typeDefinition"
            class="jskos-vue-mappingDetail-muted"
          >
            {{ details.typeDefinition }}
          </div>
        </dd>
      </template>

      <template v-if="details.relevance != null">
        <dt>Relevance</dt>
        <dd>{{ details.relevance }}</dd>
      </template>

      <template v-if="details.creators.length">
        <dt>Creator</dt>
        <dd>
          <template v-for="(creator, index) in details.creators" :key="index">
            <template v-if="index > 0"> · </template>
            <AutoLink
              v-if="creator.uri"
              :href="creator.uri"
              :text="creator.label"
            />
            <template v-else>{{ creator.label }}</template>
          </template>
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

      <template v-if="details.uri || details.identifiers.length">
        <dt>Identifier</dt>
        <dd>
          <ul class="jskos-vue-mappingDetail-list">
            <li v-if="details.uri">
              <AutoLink :href="details.uri" />
              <span class="jskos-vue-mappingDetail-muted"> (URI)</span>
            </li>
            <li v-for="identifier in details.identifiers" :key="identifier">
              <AutoLink :href="identifier" />
            </li>
          </ul>
        </dd>
      </template>

      <template v-if="details.justification">
        <dt>Justification</dt>
        <dd><AutoLink :href="details.justification" /></dd>
      </template>

      <template v-if="details.partOf.length">
        <dt>Part of</dt>
        <dd>
          <ul class="jskos-vue-mappingDetail-list">
            <li v-for="concordance in details.partOf" :key="concordance.uri">
              <AutoLink
                :href="concordance.uri"
                :text="schemeLabel(concordance) || concordance.uri"
              />
            </li>
          </ul>
        </dd>
      </template>
    </dl>
  </div>
</template>

<style>
.jskos-vue-mappingDetail-relation {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0 0.75rem;
}
.jskos-vue-mappingDetail-side {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.jskos-vue-mappingDetail-from {
  align-items: flex-end;
  text-align: right;
}
.jskos-vue-mappingDetail-to {
  align-items: flex-start;
  text-align: left;
}
.jskos-vue-mappingDetail-scheme {
  font-size: 0.8em;
  color: var(--jskos-vue-mappingDetail-muted-color, #6c757d);
}
.jskos-vue-mappingDetail-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}
.jskos-vue-mappingDetail-type-label {
  font-size: 0.75em;
  text-align: center;
  color: var(--jskos-vue-mappingDetail-muted-color, #6c757d);
}
.jskos-vue-mappingDetail-type {
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
.jskos-vue-mappingDetail-empty {
  color: var(--jskos-vue-mappingDetail-muted-color, #6c757d);
}
.jskos-vue-mappingDetail-fields {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0;
  font-size: 0.9em;
}
.jskos-vue-mappingDetail-fields dt {
  font-weight: bold;
}
.jskos-vue-mappingDetail-fields dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
.jskos-vue-mappingDetail-muted {
  color: var(--jskos-vue-mappingDetail-muted-color, #6c757d);
}
.jskos-vue-mappingDetail-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
