import { getObjectType } from "@/utils/objectTypes"
import { recordLabel } from "@/utils/import"
import { formatCount } from "@/utils/format"

/**
 * Explains why a source cannot be imported.
 *
 * @param {?string} type The source's target object type, or null when the user
 *     has not chosen one yet.
 * @param {?string} access The access state for the type's `create` action, as
 *     resolved by `useTypeAccess`.
 * @returns {?string} The reason, or null when the source can be imported.
 */
export function importBlockedReason(type, access) {
  if (!type) {
    return "Choose the content type of this source."
  }
  if (access === "unsupported") {
    return `This server does not accept imports of ${getObjectType(type).label}.`
  }
  if (access === "auth-required") {
    return "Importing this content type requires a sign-in."
  }
  if (access === "denied") {
    return "You are not authorized to import this content type."
  }
  return null
}

/**
 * Labels a content type in the import dropdown.
 *
 * @param {string} typeLabel Human-readable label of the object type.
 * @param {string} access The access state for the type's `create` action, as
 *     resolved by `useTypeAccess`.
 * @returns {string} The option text.
 */
export function importTypeOptionLabel(typeLabel, access) {
  const reason = {
    unsupported: "not supported",
    "auth-required": "sign-in required",
    denied: "not authorized",
  }[access]
  return reason ? `${typeLabel} (${reason})` : typeLabel
}

/**
 * Heads the import result, which lists the stored records below it.
 *
 * @param {!{count: number}} result The import outcome, as summarized from the
 *     server's response.
 * @returns {string} The heading stating how much was written.
 */
function importResultHeading({ count }) {
  return `Imported ${formatCount(count)} ${count === 1 ? "record" : "records"}.`
}

/**
 * Builds the notification of a finished import.
 *
 * @param {!{count: number, records: !Array<Object>}} result The import outcome,
 *     as summarized from the server's response.
 * @returns {string} The message confirming the import.
 */
export function importSuccessMessage({ count, records }) {
  // Naming the stored record is the point of importing a terminology here.
  const label = count === 1 ? recordLabel(records[0]) : ""
  return label ? `Imported "${label}".` : importResultHeading({ count })
}

/**
 * Explains an import that reached the server but stored nothing.
 *
 * @param {boolean} isBulk Whether the import ran in bulk mode, where the server
 *     drops invalid entries instead of rejecting the whole request.
 * @returns {string} The message stating why nothing was written.
 */
export function importEmptyMessage(isBulk) {
  return isBulk
    ? "Nothing was imported — the server discarded every entry as invalid."
    : "Nothing was imported — the source contained no records."
}

/**
 * Explains a missing concept scheme in terms of the SSSOM source, which
 * jskos-server's own message does not mention.
 *
 * @const {string}
 */
const SSSOM_SCHEME_HINT =
  "The SSSOM file declares no `subject_source` or `object_source`."

/**
 * Returns whether a rejection is about concept schemes missing from an SSSOM
 * source, which jskos-server reports without naming SSSOM.
 *
 * @param {string} message The rejection message returned by the server.
 * @param {?string} format The import format of the rejected source.
 * @returns {boolean} True when the message needs the SSSOM hint.
 */
function needsSssomSchemeHint(message, format) {
  return format === "sssom" && /`(from|to)Scheme`/.test(message)
}

/**
 * Classifies a failed import and builds its user-facing message.
 *
 * @param {!Error} error The error thrown by the request.
 * @param {?string} [format] The import format of the source, as detected by
 *     `detectFormat`.
 * @returns {{kind: string, message: string}} Failure kind and its message.
 */
export function describeImportError(error, format = null) {
  const status = error.response?.status
  if (status === 401 || status === 403) {
    return {
      kind: "auth",
      message: "You are not authorized to import this data.",
    }
  }
  // Connection errors
  if (!error.response) {
    return {
      kind: "network",
      message: `Could not reach the server: ${error.message}`,
    }
  }
  // jskos-server errors
  const message = error.response.data?.message ?? error.message
  if (status === 400 || status === 422) {
    const hint = needsSssomSchemeHint(message, format)
      ? ` ${SSSOM_SCHEME_HINT}`
      : ""
    return {
      kind: "rejected",
      message: `The server rejected the data: ${message}${hint}`,
    }
  }
  return { kind: "other", message }
}

/**
 * Builds the notification of a failed import.
 *
 * @param {!{error: string, errorKind: ?string}} source The source that failed.
 * @returns {string} The message to notify about.
 */
export function importFailureMessage({ error, errorKind }) {
  const hint = errorKind === "auth" ? " Sign in again and retry." : ""
  return `${error}${hint}`
}

/**
 * Explains why the import cannot be used at all.
 *
 * @param {!Object<string, string>} accessByType Access state of every
 *     importable type's `create` action, as resolved by `useTypeAccess`.
 * @returns {?{access: string, title: string, text: string}} The explanation, or
 *     null when at least one type is importable.
 */
export function importUnavailableReason(accessByType) {
  const states = Object.values(accessByType)
  if (states.includes("open")) {
    return null
  }
  if (states.includes("auth-required")) {
    return {
      access: "auth-required",
      title: "Sign in to import",
      text: "Importing requires an account on this server.",
    }
  }
  if (states.includes("denied")) {
    return {
      access: "denied",
      title: "Import not authorized",
      text: "Your account is not authorized to import any content type on this server.",
    }
  }
  return {
    access: "unsupported",
    title: "Import not available",
    text: "This server does not accept imports for any content type.",
  }
}
