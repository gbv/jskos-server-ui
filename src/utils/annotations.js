/**
 * Extracts a display string from a W3C/JSKOS annotation body.
 *
 * @param {?Object} annotation The JSKOS annotation.
 * @returns {string} The body text, or an empty string when there is none.
 */
export function annotationBodyText(annotation) {
  if (!annotation) {
    return ""
  }
  if (annotation.bodyValue != null) {
    return String(annotation.bodyValue)
  }
  const bodies = Array.isArray(annotation.body)
    ? annotation.body
    : annotation.body != null
      ? [annotation.body]
      : []
  return bodies
    .map((body) => {
      if (typeof body === "string") {
        return body
      }
      return body?.value ?? body?.id ?? ""
    })
    .filter(Boolean)
    .join(", ")
}
