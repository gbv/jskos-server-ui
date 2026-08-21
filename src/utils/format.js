const LOCALE = "en"

/**
 * Formats a number of records for display.
 *
 * @param {?number} value The number to format.
 * @returns {string} The grouped number, or an empty string when unknown.
 */
export function formatCount(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return ""
  }
  return value.toLocaleString(LOCALE)
}

/**
 * Binary size units, in ascending order.
 *
 * @const {!Array<string>}
 */
const BYTE_UNITS = ["B", "KiB", "MiB", "GiB"]

/**
 * Formats a byte count for display.
 *
 * @param {?number} bytes The number of bytes.
 * @returns {string} A human-readable size, or an empty string when unknown.
 */
export function formatByteSize(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) {
    return ""
  }
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  const rounded = unitIndex === 0 ? size : Math.round(size * 10) / 10
  return `${rounded} ${BYTE_UNITS[unitIndex]}`
}
