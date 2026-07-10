import * as jskos from "jskos-tools"
import { useNotify } from "@/composables/useNotify"

/**
 * Registry-loading helpers for URL-selected browse items (schemes, concepts).
 *
 * @param {import("vue").Ref<?Object>} config reactive browse type config (a BrowseType).
 * @param {Object} store the server store exposing the configured registries.
 * @returns {{ loadDetail: Function, resolveConceptHierarchy: Function }}
 */
export function useBrowseItemDetail(config, store) {
  const { notify } = useNotify()

  /**
   * Loads the full record for a URL-selected item (e.g. a deep link).
   *
   * @param {string} uri the item URI to resolve.
   * @returns {Promise<?Object>} the loaded record, a `{ uri }` stub on failure,
   *   or null when the type or registry cannot resolve it.
   */
  async function loadDetail(uri) {
    if (!uri || config.value?.selection !== "url") {
      return null
    }
    const registry = store[config.value.registry]
    if (!registry) {
      return null
    }
    try {
      const result = config.value.hierarchical
        ? await registry.getConcepts({ concepts: [{ uri }] })
        : await registry.getSchemes({ params: { uri } })
      return result?.[0] ?? { uri }
    } catch (error) {
      notify(`Could not load details: ${error.message}`, "danger")
      return { uri }
    }
  }

  /**
   * Fetches a concept's unresolved hierarchy relations, which JSKOS marks with a
   * `null` placeholder (e.g. `narrower: [null]`), and replaces them in place.
   *
   * @param {?Object} concept the concept whose relations should be resolved.
   */
  async function resolveConceptHierarchy(concept) {
    if (!config.value?.hierarchical || !concept?.uri) {
      return
    }
    const registry = store[config.value.registry]
    if (!registry) {
      return
    }
    if (concept.narrower?.includes(null) && registry.getNarrower) {
      try {
        concept.narrower = jskos.sortConcepts(
          await registry.getNarrower({ concept }),
        )
      } catch (error) {
        notify(`Could not load narrower concepts: ${error.message}`, "danger")
        concept.narrower = []
      }
    }
    if (concept.ancestors?.includes(null) && registry.getAncestors) {
      try {
        concept.ancestors = await registry.getAncestors({ concept })
      } catch (error) {
        notify(`Could not load ancestors: ${error.message}`, "danger")
        concept.ancestors = []
      }
    }
  }

  return { loadDetail, resolveConceptHierarchy }
}
