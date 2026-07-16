/**
 * One browsable object type of a jskos-server.
 *
 * @typedef {Object} BrowseType
 * @property {string} capability Key used against the server store's capabilities.
 * @property {string} label Human-readable heading.
 * @property {string} route Router path linking to this type's browse view (e.g. "/terminologies").
 * @property {string} count Registry method returning the type's total count for the overview card.
 * @property {string} registry Server-store registry to call ("registry" or "mappingsRegistry").
 * @property {?string} list Registry method returning a paginated array (with `_totalCount`), or null when the type has no generic list endpoint (e.g. hierarchical concepts).
 * @property {boolean} hierarchical Whether records form a scheme-bound hierarchy, rendered via ConceptTree instead of a flat list.
 * @property {string} listComponent Key selecting the flat list renderer, doubling as the renderer's collection prop name: `"items"` (ItemList), `"mappings"` (MappingList), `"concordances"` (ConcordanceList). Ignored for hierarchical types. Meant to grow for other non-item types (occurrences, annotations).
 * @property {?string} detailComponent Key selecting the detail renderer, doubling as its record prop name: `"item"` (BrowseDetail), `"mapping"` (MappingDetail), `"concordance"` (ConcordanceDetail), or null when the type has no detail pane.
 * @property {"url"|"memory"} selection Where the current selection lives: `"url"` for URI-resolvable JSKOS items (deep-linkable via the route), `"memory"` for records only available from the loaded list (mappings, concordances).
 */

/**
 * Central configuration for the generic browse view, keyed by object type.
 *
 * Adding a browsable type is meant to be additive: add an entry here and, for a
 * new record shape, register its renderer(s) in the component maps in
 * BrowseList (list) and BrowseView (detail).
 *
 * @const {!Object<string, BrowseType>}
 */
export const BROWSE_TYPES = {
  schemes: {
    capability: "schemes",
    label: "Terminologies",
    route: "/terminologies",
    count: "getSchemes",
    registry: "registry",
    list: "getSchemes",
    hierarchical: false,
    listComponent: "items",
    detailComponent: "item",
    selection: "url",
  },
  concepts: {
    capability: "concepts",
    label: "Concepts",
    route: "/concepts",
    count: "getConcepts",
    registry: "registry",
    list: null,
    hierarchical: true,
    listComponent: "items",
    detailComponent: "item",
    selection: "url",
  },
  mappings: {
    capability: "mappings",
    label: "Mappings",
    route: "/mappings",
    count: "getMappings",
    registry: "mappingsRegistry",
    list: "getMappings",
    hierarchical: false,
    listComponent: "mappings",
    detailComponent: "mapping",
    selection: "memory",
  },
  concordances: {
    capability: "concordances",
    label: "Concordances",
    route: "/concordances",
    count: "getConcordances",
    registry: "mappingsRegistry",
    list: "getConcordances",
    hierarchical: false,
    listComponent: "concordances",
    detailComponent: "concordance",
    selection: "memory",
  },
  annotations: {
    capability: "annotations",
    label: "Annotations",
    route: "/annotations",
    count: "getAnnotations",
    registry: "mappingsRegistry",
    list: "getAnnotations",
    hierarchical: false,
    listComponent: "annotations",
    detailComponent: "annotation",
    selection: "memory",
  },
}

/**
 * Returns the browse configuration for a given type key.
 *
 * @param {string} type One of the keys of BROWSE_TYPES.
 * @returns {?BrowseType} The config entry, or null if the type is unknown.
 */
export function getBrowseType(type) {
  return BROWSE_TYPES[type] ?? null
}
