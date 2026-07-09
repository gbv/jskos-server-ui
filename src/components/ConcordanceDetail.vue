<script setup>
import { computed } from "vue"
import * as jskos from "jskos-tools"
import { ItemName, Arrow, AutoLink, utils } from "jskos-vue"

/**
 * Detail view for a single JSKOS concordance: source/target schemes,
 * description, provenance, dates, license, downloads, extent and identifiers.
 */
const props = defineProps({
  concordance: {
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
 * Flattens an agent field (publisher/creator/contributor) into display-ready
 * entries.
 * @param {*} agent Raw agent value (object, string, or array of them).
 * @return {!Array<{label: string, href: ?string}>} Display-ready agents.
 */
function normalizeAgents(agent) {
  if (!agent) {
    return []
  }
  const list = Array.isArray(agent) ? agent : [agent]
  return list
    .map((entry) => {
      if (typeof entry === "string") {
        return { label: entry, href: null }
      }
      return {
        label:
          jskos.prefLabel(entry, { language: resolvedLanguage.value }) ||
          entry.url ||
          entry.uri ||
          "",
        href: entry.url || entry.uri || null,
      }
    })
    .filter((entry) => entry.label || entry.href)
}

/**
 * Label for a distribution's download link (format/mimetype, else "Download").
 * @param {!Object} distribution A JSKOS distribution.
 * @return {string} The link label.
 */
function distributionLabel(distribution) {
  return distribution.format || distribution.mimetype || "Download"
}

const details = computed(() => {
  const concordance = props.concordance
  if (!concordance) {
    return null
  }
  return {
    fromScheme: concordance.fromScheme || null,
    toScheme: concordance.toScheme || null,
    notation: jskos.notation(concordance) || "",
    scopeNote: (
      jskos.languageMapContent(concordance, "scopeNote") || []
    ).filter(Boolean),
    publishers: normalizeAgents(concordance.publisher),
    creators: normalizeAgents(concordance.creator),
    contributors: normalizeAgents(concordance.contributor),
    created: concordance.created || null,
    modified: concordance.modified || null,
    licenses: (concordance.license || []).filter((entry) => entry?.uri),
    distributions: (concordance.distributions || []).filter(
      (entry) => entry?.download,
    ),
    extent: concordance.extent ?? null,
    url: concordance.url || null,
    uri: concordance.uri || null,
    identifiers: (concordance.identifier || []).filter(Boolean),
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
  <div v-if="details" class="jskos-vue-concordanceDetail">
    <div class="jskos-vue-concordanceDetail-relation">
      <div
        class="jskos-vue-concordanceDetail-side jskos-vue-concordanceDetail-from"
      >
        <ItemName
          v-if="details.fromScheme"
          :item="details.fromScheme"
          v-bind="itemNameOptions"
        />
        <span v-else class="jskos-vue-concordanceDetail-empty">&mdash;</span>
      </div>

      <div class="jskos-vue-concordanceDetail-connector">
        <Arrow direction="right" />
      </div>

      <div
        class="jskos-vue-concordanceDetail-side jskos-vue-concordanceDetail-to"
      >
        <ItemName
          v-if="details.toScheme"
          :item="details.toScheme"
          v-bind="itemNameOptions"
        />
        <span v-else class="jskos-vue-concordanceDetail-empty">&mdash;</span>
      </div>
    </div>

    <dl class="jskos-vue-concordanceDetail-fields">
      <template v-if="details.notation">
        <dt>Notation</dt>
        <dd>{{ details.notation }}</dd>
      </template>

      <template v-if="details.scopeNote.length">
        <dt>Description</dt>
        <dd>{{ details.scopeNote.join(" ") }}</dd>
      </template>

      <template v-if="details.publishers.length">
        <dt>Publisher</dt>
        <dd>
          <template
            v-for="(publisher, index) in details.publishers"
            :key="index"
          >
            <template v-if="index > 0"> · </template>
            <AutoLink
              v-if="publisher.href"
              :href="publisher.href"
              :text="publisher.label"
            />
            <template v-else>{{ publisher.label }}</template>
          </template>
        </dd>
      </template>

      <template v-if="details.creators.length">
        <dt>Creator</dt>
        <dd>
          <template v-for="(creator, index) in details.creators" :key="index">
            <template v-if="index > 0"> · </template>
            <AutoLink
              v-if="creator.href"
              :href="creator.href"
              :text="creator.label"
            />
            <template v-else>{{ creator.label }}</template>
          </template>
        </dd>
      </template>

      <template v-if="details.contributors.length">
        <dt>Contributor</dt>
        <dd>
          <template
            v-for="(contributor, index) in details.contributors"
            :key="index"
          >
            <template v-if="index > 0"> · </template>
            <AutoLink
              v-if="contributor.href"
              :href="contributor.href"
              :text="contributor.label"
            />
            <template v-else>{{ contributor.label }}</template>
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

      <template v-if="details.licenses.length">
        <dt>License</dt>
        <dd>
          <ul class="jskos-vue-concordanceDetail-list">
            <li v-for="license in details.licenses" :key="license.uri">
              <AutoLink :href="license.uri" />
            </li>
          </ul>
        </dd>
      </template>

      <template v-if="details.distributions.length">
        <dt>Download</dt>
        <dd>
          <ul class="jskos-vue-concordanceDetail-list">
            <li
              v-for="(distribution, index) in details.distributions"
              :key="index"
            >
              <AutoLink
                :href="distribution.download"
                :text="distributionLabel(distribution)"
              />
            </li>
          </ul>
        </dd>
      </template>

      <template v-if="details.extent != null">
        <dt>Mappings</dt>
        <dd>{{ details.extent }}</dd>
      </template>

      <template v-if="details.url">
        <dt>API URL</dt>
        <dd><AutoLink :href="details.url" /></dd>
      </template>

      <template v-if="details.uri || details.identifiers.length">
        <dt>Identifier</dt>
        <dd>
          <ul class="jskos-vue-concordanceDetail-list">
            <li v-if="details.uri">
              <AutoLink :href="details.uri" />
              <span class="jskos-vue-concordanceDetail-muted"> (URI)</span>
            </li>
            <li v-for="identifier in details.identifiers" :key="identifier">
              <AutoLink :href="identifier" />
            </li>
          </ul>
        </dd>
      </template>
    </dl>
  </div>
</template>

<style>
.jskos-vue-concordanceDetail-relation {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0 0.75rem;
}
.jskos-vue-concordanceDetail-side {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.jskos-vue-concordanceDetail-from {
  align-items: flex-end;
  text-align: right;
}
.jskos-vue-concordanceDetail-to {
  align-items: flex-start;
  text-align: left;
}
.jskos-vue-concordanceDetail-connector {
  display: flex;
  justify-content: center;
  color: var(--jskos-vue-concordanceDetail-muted-color, #6c757d);
}
.jskos-vue-concordanceDetail-empty {
  color: var(--jskos-vue-concordanceDetail-muted-color, #6c757d);
}
.jskos-vue-concordanceDetail-fields {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0;
  font-size: 0.9em;
}
.jskos-vue-concordanceDetail-fields dt {
  font-weight: bold;
}
.jskos-vue-concordanceDetail-fields dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
.jskos-vue-concordanceDetail-muted {
  color: var(--jskos-vue-concordanceDetail-muted-color, #6c757d);
}
.jskos-vue-concordanceDetail-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
