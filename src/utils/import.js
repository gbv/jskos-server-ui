import jskos from "jskos-tools"
import { OBJECT_TYPES, getObjectType } from "@/utils/objectTypes"

/**
 * Object types that can be imported, in the order they are offered in the UI.
 *
 * @const {!Array<string>}
 */
export const IMPORTABLE_TYPES = Object.keys(OBJECT_TYPES).filter(
  (type) => OBJECT_TYPES[type].importPath,
)

/**
 * Import formats keyed by the file extension they are recognized by.
 *
 * @const {!Object<string, string>}
 */
const FORMAT_BY_EXTENSION = {
  json: "json",
  ndjson: "ndjson",
}

/**
 * Value for the file input's `accept` attribute.
 *
 * @const {string}
 */
export const ACCEPTED_FILE_TYPES = Object.keys(FORMAT_BY_EXTENSION)
  .map((extension) => `.${extension}`)
  .join(",")

/**
 * Human-readable counterpart of {@link ACCEPTED_FILE_TYPES}, e.g.
 * `.json or .ndjson`.
 *
 * @const {string}
 */
export const ACCEPTED_FILE_TYPES_HINT = new Intl.ListFormat("en", {
  style: "long",
  type: "disjunction",
}).format(ACCEPTED_FILE_TYPES.split(","))

/**
 * Our plural type keys, keyed by the singular short names of jskos-tools.
 *
 * @const {!Object<string, string>}
 */
const TYPE_BY_SHORT_NAME = Object.fromEntries(
  IMPORTABLE_TYPES.map((type) => [jskos.guessObjectType(type, true), type]),
)

/**
 * Returns whether an object type can be imported.
 *
 * @param {string} type The object type key.
 * @returns {boolean} True if the type has an import endpoint.
 */
function isImportable(type) {
  return Boolean(getObjectType(type)?.importPath)
}

/**
 * Joins a path to the base URL of a jskos-server.
 *
 * @param {string} baseUrl Base URL of the connected jskos-server.
 * @param {string} path The path, relative to the base URL.
 * @returns {string} The absolute URL.
 */
function resolveServerUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, "")}/${path}`
}

/**
 * Builds the import endpoint URL for an object type.
 *
 * @param {string} baseUrl Base URL of the connected jskos-server.
 * @param {string} type The object type key.
 * @returns {string} The absolute URL to POST the import to.
 * @throws {Error} If the type has no import endpoint.
 */
export function resolveImportUrl(baseUrl, type) {
  if (!isImportable(type)) {
    throw new Error(`Object type ${type} cannot be imported.`)
  }
  return resolveServerUrl(baseUrl, getObjectType(type).importPath)
}

/**
 * Builds the URL serving a record's raw JSKOS data.
 *
 * jskos-server resolves a URI to whichever object carries it, so this works for
 * every importable type, including those without a browsable detail view.
 *
 * @param {string} baseUrl Base URL of the connected jskos-server.
 * @param {string} uri URI of the record.
 * @returns {string} The absolute URL returning the record as JSON.
 */
export function resolveDataUrl(baseUrl, uri) {
  return resolveServerUrl(baseUrl, `data?uri=${encodeURIComponent(uri)}`)
}

/**
 * Names a record the way `ItemName` renders it, as plain text.
 *
 * @param {?Object} record A JSKOS record.
 * @returns {string} The notation and label, or an empty string when the record
 *     carries neither.
 */
export function recordLabel(record) {
  if (!record) {
    return ""
  }
  return [
    jskos.notation(record),
    jskos.prefLabel(record, { fallbackToUri: false }),
  ]
    .filter(Boolean)
    .join(" ")
}

/**
 * What an import wrote, as reported back by the server.
 *
 * @typedef {Object} ImportResult
 * @property {string} type The object type the records were imported as.
 * @property {number} count How many records the server stored.
 * @property {!Array<Object>} records The stored records, capped at
 *     {@link MAX_LISTED_RECORDS}. A bulk import reports URIs only.
 */

/**
 * How many imported records a result keeps for display. A non-bulk import
 * echoes every written record, which can be tens of thousands of concepts.
 *
 * @const {number}
 */
export const MAX_LISTED_RECORDS = 10

/**
 * Summarizes what the server reported back after an import.
 *
 * @param {Object|Array<Object>} response The parsed server response.
 * @param {string} type The object type the records were imported as.
 * @returns {!ImportResult} Number of imported entities and the first of them.
 */
export function summarizeResult(response, type) {
  const items = Array.isArray(response) ? response : [response].filter(Boolean)
  return {
    type,
    count: items.length,
    records: items.slice(0, MAX_LISTED_RECORDS),
  }
}

/**
 * Returns whether an error was raised because the import was aborted.
 *
 * @param {!Error} error The error thrown by the request.
 * @returns {boolean} True when the user canceled the request.
 */
export function isCanceled(error) {
  return (
    error.code === "ERR_CANCELED" ||
    error.name === "CanceledError" ||
    error.name === "AbortError"
  )
}

/**
 * Detects the import format from a file name or URL.
 *
 * @param {string} nameOrUrl A file name or URL.
 * @returns {?string} `"json"`, `"ndjson"`, or null when the extension is
 *     missing or unknown.
 */
export function detectFormat(nameOrUrl) {
  if (!nameOrUrl) {
    return null
  }
  const path = String(nameOrUrl).split(/[?#]/)[0]
  const extension = path.slice(path.lastIndexOf(".") + 1).toLowerCase()
  return FORMAT_BY_EXTENSION[extension] ?? null
}

/**
 * Parses JSON text, treating unparsable text as an expected outcome.
 *
 * @param {string} text The text to parse.
 * @returns {*} The parsed value, or null when the text is not valid JSON.
 */
function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * Extracts the first JSKOS object from a sample of an import source.
 *
 * @param {string} text A sample as returned by {@link readSample}.
 * @param {?string} format The import format from {@link detectFormat}.
 * @returns {?Object} The first object, or null when the sample holds none.
 */
export function extractFirstObject(text, format) {
  const value = parseJson(
    format === "ndjson" ? text.trimStart().split("\n")[0] : text,
  )
  const first = Array.isArray(value) ? value[0] : value
  return first && typeof first === "object" ? first : null
}

/**
 * Guesses the object type of a sample JSKOS object.
 *
 * @param {?Object} object A sample object taken from the import source.
 * @returns {?string} The object type key, or null when it cannot be guessed.
 */
export function guessType(object) {
  if (!object || typeof object !== "object") {
    return null
  }
  return TYPE_BY_SHORT_NAME[jskos.guessObjectType(object, true)] ?? null
}

/**
 * Largest `.json` file that is read as a whole for inspection, in bytes.
 *
 * @const {number}
 */
const MAX_SAMPLE_SIZE = 5 * 1024 * 1024

/**
 * How much is read from files that are not read as a whole, in bytes.
 *
 * @const {number}
 */
const SAMPLE_BYTE_COUNT = 65536

/**
 * Reads enough of a file to determine which objects it contains.
 *
 * @param {!File} file The file to read.
 * @param {?string} format The import format from {@link detectFormat}.
 * @returns {!Promise<string>} The decoded sample.
 */
export function readSample(file, format) {
  const shouldReadFully = format === "json" && file.size <= MAX_SAMPLE_SIZE
  return shouldReadFully ? file.text() : file.slice(0, SAMPLE_BYTE_COUNT).text()
}
