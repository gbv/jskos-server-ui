/**
 * One browsable object type of a jskos-server.
 *
 * @typedef {Object} BrowseType
 * @property {string} capability Key used against the server store's capabilities.
 * @property {string} label Human-readable heading.
 * @property {string} registry Server-store registry to call ("registry" or "mappingsRegistry").
 * @property {?string} list Registry method returning a paginated array (with `_totalCount`), or null when the type has no generic list endpoint.
 * @property {boolean} item Whether records are JSKOS items renderable via jskos-vue (ItemName / ItemList / ItemDetails).
 * @property {boolean} hierarchical Whether records form a scheme-bound hierarchy.
 */

/**
 * Central configuration for the generic browse view, keyed by object type.
 *
 * @const {!Object<string, BrowseType>}
 */
export const BROWSE_TYPES = {
  schemes: {
    capability: "schemes",
    label: "Terminologies",
    registry: "registry",
    list: "getSchemes",
    item: true,
    hierarchical: false,
  },
  concepts: {
    capability: "concepts",
    label: "Concepts",
    registry: "registry",
    list: null,
    item: true,
    hierarchical: true,
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
