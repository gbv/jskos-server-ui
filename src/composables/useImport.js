import { ref, computed } from "vue"
import { useServerStore } from "@/stores/server"
import { useNotify } from "@/composables/useNotify"
import { useTypeAccess } from "@/composables/useTypeAccess"
import { getObjectType } from "@/utils/objectTypes"
import {
  IMPORTABLE_TYPES,
  detectFormat,
  extractFirstObject,
  guessType,
  isCanceled,
  readSample,
  resolveImportUrl,
  summarizeResult,
} from "@/utils/import"
import {
  describeImportError,
  importBlockedReason,
  importEmptyMessage,
  importFailureMessage,
  importSuccessMessage,
  importUnavailableReason,
} from "@/utils/importMessages"

/**
 * The source of an import: either a dropped file or a remote URL.
 *
 * @typedef {Object} ImportSource
 * @property {"file"|"url"} kind Where the data comes from.
 * @property {?File} file The dropped file, for `kind === "file"`.
 * @property {string} url The remote URL, for `kind === "url"`.
 * @property {string} name Display name.
 * @property {?number} size File size in bytes, or null for URLs.
 * @property {?string} format Detected import format, or null when unknown.
 * @property {?string} detectedType Object type key guessed from the data.
 * @property {"pending"|"uploading"|"done"|"failed"} status Current state.
 * @property {?string} error Error message when `status === "failed"`.
 * @property {?string} errorKind What kind of failure occurred: `"auth"`,
 *     `"network"`, `"rejected"`, `"empty"`, `"canceled"`, or `"other"`.
 * @property {?ImportResult} result Import outcome when `status === "done"`.
 */

/**
 * Provides the import source and its upload to the connected jskos-server.
 *
 * @returns {Object} The source, its state, and its mutators.
 */
export function useImport() {
  const store = useServerStore()
  const { notify } = useNotify()
  const { resolveAccess } = useTypeAccess()

  const source = ref(null)
  const isBulk = ref(false)
  const selectedType = ref(null)

  let abortController = null

  /**
   * Whether an import run would write the current source.
   */
  const canImport = computed(
    () =>
      source.value?.status === "pending" || source.value?.status === "failed",
  )

  /**
   * Access state of every importable type's `create` action.
   */
  const typeAccess = computed(() =>
    Object.fromEntries(
      IMPORTABLE_TYPES.map((type) => [type, resolveAccess(type, "create")]),
    ),
  )

  /**
   * Why nothing can be imported at all, or null when the import is usable.
   */
  const unavailableReason = computed(() =>
    importUnavailableReason(typeAccess.value),
  )

  /**
   * Why the import cannot run, or null when it can.
   */
  const blockedReason = computed(() =>
    importBlockedReason(
      selectedType.value,
      selectedType.value ? typeAccess.value[selectedType.value] : null,
    ),
  )

  /**
   * Whether the source holds data that looks like a different object type than
   * the selected one.
   */
  const hasTypeMismatch = computed(
    () =>
      Boolean(selectedType.value) &&
      Boolean(source.value?.detectedType) &&
      source.value.detectedType !== selectedType.value,
  )

  const isUploading = computed(() => source.value?.status === "uploading")

  /**
   * What a finished import wrote, or null while none succeeded.
   */
  const result = computed(() =>
    source.value?.status === "done" ? source.value.result : null,
  )

  /**
   * Creates the state of a newly selected source.
   *
   * @param {{kind: string, file?: File, url?: string}} options Source origin.
   * @returns {!ImportSource} The source state.
   */
  function createSource({ kind, file = null, url = "" }) {
    const name = kind === "file" ? file.name : url
    return {
      kind,
      file,
      url,
      name,
      size: kind === "file" ? file.size : null,
      format: detectFormat(name),
      detectedType: null,
      status: "pending",
      error: null,
      errorKind: null,
      result: null,
    }
  }

  /**
   * Reads the source's object type from its data and preselects it.
   *
   * @returns {!Promise<void>} Resolves once the source has been inspected.
   */
  async function inspectSource() {
    const inspected = source.value
    if (inspected.kind !== "file") {
      return
    }
    try {
      const sample = await readSample(inspected.file, inspected.format)
      inspected.detectedType = guessType(
        extractFirstObject(sample, inspected.format),
      )
    } catch (error) {
      notify(`Could not read ${inspected.name}: ${error.message}`, "warning")
      return
    }
    if (
      inspected.detectedType &&
      inspected === source.value &&
      !selectedType.value
    ) {
      selectedType.value = inspected.detectedType
    }
  }

  /**
   * Imports from a dropped or selected file.
   *
   * @param {!File} file The file to import.
   */
  function addFile(file) {
    if (!file.size) {
      notify(`Skipped empty file: ${file.name}.`, "warning")
      return
    }
    setSource(createSource({ kind: "file", file }))
    inspectSource()
  }

  /**
   * Imports from a remote URL.
   *
   * @param {string} url The URL to import from.
   */
  function addUrl(url) {
    const trimmed = url.trim()
    if (!trimmed) {
      return
    }
    setSource(createSource({ kind: "url", url: trimmed }))
  }

  /**
   * Replaces the source.
   *
   * @param {!ImportSource} added The new source.
   */
  function setSource(added) {
    source.value = added
    selectedType.value = null
  }

  /**
   * Drops the source and its outcome, returning the import to its start.
   *
   * The bulk setting survives, so a series of imports does not have to switch
   * it back on for every source.
   */
  function reset() {
    source.value = null
    selectedType.value = null
  }

  /**
   * Reports a file that was rejected before reaching the import.
   *
   * @param {string} name Name of the rejected file.
   */
  function reportRejectedFile(name) {
    notify(
      `Cannot import ${name} — only JSON and NDJSON are supported.`,
      "warning",
    )
  }

  /**
   * Reports a drop of more than one file.
   */
  function reportMultipleFiles() {
    notify("Only one file can be imported at a time.", "warning")
  }

  /**
   * Builds the request parameters.
   *
   * A URL is handed to the server, which fetches it itself.
   * A file is streamed as multipart form data.
   *
   * @param {!ImportSource} imported The source to import.
   * @returns {!Object} The request parameters.
   */
  function buildParams(imported) {
    const params = {}
    if (isBulk.value) {
      params.bulk = true
    }
    if (imported.kind === "url") {
      params.url = imported.url
      if (imported.format) {
        params.type = imported.format
      }
    }
    return params
  }

  /**
   * Builds the request body.
   *
   * @param {!ImportSource} imported The source to import.
   * @returns {?FormData} The body, or null when the server fetches the data.
   */
  function buildBody(imported) {
    if (imported.kind !== "file") {
      return null
    }
    const body = new FormData()
    body.append("data", imported.file, imported.file.name)
    return body
  }

  /**
   * Aborts a running import.
   */
  function cancelImport() {
    abortController?.abort()
  }

  /**
   * Imports the source into the connected server.
   *
   * @returns {!Promise<void>} Resolves once the source reached a final state.
   * @throws {Error} If no content type is selected, which `startImport` rules
   *     out before calling this.
   */
  async function importSource() {
    const imported = source.value
    const type = selectedType.value
    if (!type) {
      throw new Error("Import started without a content type.")
    }
    const registry = store[getObjectType(type).registry]
    if (!store.activeUrl || !registry) {
      imported.status = "failed"
      imported.errorKind = "other"
      imported.error = "No server connected."
      return
    }

    imported.status = "uploading"
    imported.error = null
    imported.errorKind = null
    imported.result = null
    abortController = new AbortController()
    try {
      const response = await registry.axios({
        method: "post",
        url: resolveImportUrl(store.activeUrl, type),
        params: buildParams(imported),
        data: buildBody(imported),
        signal: abortController.signal,
      })
      imported.result = summarizeResult(response, type)
      if (!imported.result.count) {
        imported.status = "failed"
        imported.errorKind = "empty"
        imported.error = importEmptyMessage(isBulk.value)
        return
      }
      imported.status = "done"
    } catch (error) {
      if (isCanceled(error)) {
        imported.status = "pending"
        imported.errorKind = "canceled"
        return
      }
      const { kind, message } = describeImportError(error)
      imported.status = "failed"
      imported.errorKind = kind
      imported.error = message
    } finally {
      abortController = null
    }
  }

  /**
   * Imports the source and reports the outcome.
   *
   * @returns {!Promise<void>} Resolves once the import has finished.
   */
  async function startImport() {
    if (blockedReason.value || !canImport.value) {
      return
    }
    await importSource()
    if (source.value.errorKind === "canceled") {
      notify("Import canceled.", "warning")
      return
    }
    if (source.value.status === "failed") {
      notify(importFailureMessage(source.value), "danger")
      return
    }
    notify(importSuccessMessage(source.value.result), "success")
  }

  return {
    source,
    isBulk,
    selectedType,
    canImport,
    typeAccess,
    unavailableReason,
    blockedReason,
    hasTypeMismatch,
    isUploading,
    result,
    addFile,
    addUrl,
    reset,
    reportRejectedFile,
    reportMultipleFiles,
    cancelImport,
    startImport,
  }
}
