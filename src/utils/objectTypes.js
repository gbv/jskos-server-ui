/**
 * One object type of a jskos-server.
 *
 * @typedef {Object} ObjectType
 * @property {string} label Human-readable heading.
 * @property {string} registry Server-store registry to call ("registry" or "mappingsRegistry").
 * @property {?string} count Registry method returning the type's total count of objects.
 * @property {string} [route] Router path linking to this type's browse view.
 * @property {?string} [list] Registry method returning a paginated array (with `_totalCount`), or null when the type has no generic list endpoint (e.g. hierarchical concepts).
 * @property {boolean} [hierarchical] Whether records form a scheme-bound hierarchy, rendered via ConceptTree instead of a flat list.
 * @property {string} [listComponent] Key selecting the flat list renderer, doubling as its collection prop name (e.g. `"items"` for ItemList). Ignored for hierarchical types.
 * @property {?string} [detailComponent] Key selecting the detail renderer, doubling as its record prop name (e.g. `"item"` for BrowseDetail), or null when the type has no detail pane.
 * @property {"url"|"memory"} [selection] Where the current selection lives: `"url"` for URI-resolvable JSKOS items (deep-linkable via the route), `"memory"` for records only available from the loaded list (mappings, concordances).
 * @property {Object<string, {method: string, recordKey: string}>} [actions] Registry write actions keyed by capability action name (e.g. `"delete"`). `method` is the registry method to call, `recordKey` the parameter name the record is passed as. Absent when the type has no write actions in the UI.
 */

/**
 * A jskos-server's object types, keyed by capability/endpoint name.
 * Key order drives the capability parsing and the service-info table rows.
 *
 * @const {!Object<string, ObjectType>}
 */
export const OBJECT_TYPES = {
  schemes: {
    label: "Terminologies",
    registry: "registry",
    count: "getSchemes",
    route: "/terminologies",
    list: "getSchemes",
    hierarchical: false,
    listComponent: "items",
    detailComponent: "item",
    selection: "url",
  },
  concepts: {
    label: "Concepts",
    registry: "registry",
    count: "getConcepts",
    route: "/concepts",
    list: null,
    hierarchical: true,
    listComponent: "items",
    detailComponent: "item",
    selection: "url",
  },
  mappings: {
    label: "Mappings",
    registry: "mappingsRegistry",
    count: "getMappings",
    route: "/mappings",
    list: "getMappings",
    hierarchical: false,
    listComponent: "mappings",
    detailComponent: "mapping",
    selection: "memory",
    actions: {
      delete: { method: "deleteMapping", recordKey: "mapping" },
    },
  },
  concordances: {
    label: "Concordances",
    registry: "mappingsRegistry",
    count: "getConcordances",
    route: "/concordances",
    list: "getConcordances",
    hierarchical: false,
    listComponent: "concordances",
    detailComponent: "concordance",
    selection: "memory",
    actions: {
      delete: { method: "deleteConcordance", recordKey: "concordance" },
    },
  },
  annotations: {
    label: "Annotations",
    registry: "mappingsRegistry",
    count: "getAnnotations",
    route: "/annotations",
    list: "getAnnotations",
    hierarchical: false,
    listComponent: "annotations",
    detailComponent: "annotation",
    selection: "memory",
    actions: {
      delete: { method: "deleteAnnotation", recordKey: "annotation" },
    },
  },
  registries: {
    label: "Registries",
    registry: "registry",
    count: "getRegistries",
    route: "/registries",
    list: "getRegistries",
    hierarchical: false,
    listComponent: "items",
    detailComponent: "item",
    selection: "url",
  },
  occurrences: {
    label: "Occurrences",
    registry: "registry",
    count: null, // TODO: count and browse once cocoda-sdk exposes occurences
  },
}

/**
 * Returns the configuration for a given object type.
 *
 * @param {string} type One of the keys of OBJECT_TYPES.
 * @returns {?ObjectType} The config entry, or null if the type is unknown.
 */
export function getObjectType(type) {
  return OBJECT_TYPES[type] ?? null
}

/**
 * Returns whether an object type has a dedicated browse view.
 *
 * @param {string} type The object type key.
 * @returns {boolean} True if the type is browsable (has a route).
 */
export function isBrowsable(type) {
  return Boolean(OBJECT_TYPES[type]?.route)
}
