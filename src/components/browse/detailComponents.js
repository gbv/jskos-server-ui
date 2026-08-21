import BrowseDetail from "@/components/browse/BrowseDetail.vue"
import MappingDetail from "@/components/browse/MappingDetail.vue"
import ConcordanceDetail from "@/components/browse/ConcordanceDetail.vue"
import AnnotationDetail from "@/components/browse/AnnotationDetail.vue"
import { getObjectType } from "@/utils/objectTypes"

const DETAIL_COMPONENTS = {
  item: BrowseDetail,
  mapping: MappingDetail,
  concordance: ConcordanceDetail,
  annotation: AnnotationDetail,
}

/**
 * Returns the detail renderer for an object type.
 *
 * @param {?string} type One of the keys of OBJECT_TYPES.
 * @returns {?Object} The detail component, or null when the type is unknown or
 *     has no detail pane.
 */
export function getDetailComponent(type) {
  const key = getObjectType(type)?.detailComponent
  return (key && DETAIL_COMPONENTS[key]) ?? null
}
