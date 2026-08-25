import { toRaw } from "vue"
import { flushPromises } from "@vue/test-utils"
import { createTestingPinia } from "@pinia/testing"
import { setActivePinia } from "pinia"
import { useImport } from "@/composables/useImport"

const notify = vi.hoisted(() => vi.fn())

vi.mock("@/composables/useNotify", () => ({
  useNotify: () => ({ notify }),
}))

const auth = vi.hoisted(() => ({}))

vi.mock("@/composables/useAuth", async () => {
  const { ref } = await import("vue")
  auth.user = ref(null)
  auth.token = ref(null)
  auth.loginPublicKey = ref(null)
  auth.loggedIn = ref(false)
  return { useAuth: () => auth }
})

const openCreate = { supported: true, requiresAuth: false }

/**
 * Builds a registry mock exposing the axios instance the import writes through.
 */
function makeRegistry(response = [{ uri: "urn:imported" }]) {
  return {
    axios: vi.fn().mockResolvedValue(response),
    isAuthorizedFor: vi.fn(() => true),
  }
}

function setup({ capabilities, registry, mappingsRegistry } = {}) {
  const registryMock = registry ?? makeRegistry()
  const mappingsMock = mappingsRegistry ?? makeRegistry()
  setActivePinia(
    createTestingPinia({
      initialState: {
        server: {
          activeUrl: "http://localhost:3000/",
          registry: registryMock,
          mappingsRegistry: mappingsMock,
          capabilities: capabilities ?? {
            schemes: { create: openCreate },
            concepts: { create: openCreate },
            mappings: { create: openCreate },
          },
        },
      },
      stubActions: false,
    }),
  )
  return { queue: useImport(), registryMock, mappingsMock }
}

function makeFile(content, name) {
  return new File([content], name)
}

const schemeLine =
  '{"uri":"urn:test:scheme","type":["http://www.w3.org/2004/02/skos/core#ConceptScheme"]}'

const sssomLines = [
  "#mapping_set_id: urn:test:set",
  "subject_id\tpredicate_id\tobject_id\tmapping_justification",
  "EX:1\tskos:exactMatch\tEX:2\tsemapv:ManualMappingCuration",
].join("\n")

beforeEach(() => {
  notify.mockClear()
})

describe("source selection", () => {
  it("adds a file with detected format and type", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(`${schemeLine}\n${schemeLine}\n`, "voc.ndjson"))
    await flushPromises()

    expect(queue.source.value).toMatchObject({
      kind: "file",
      format: "ndjson",
      detectedType: "schemes",
      status: "pending",
    })
  })

  it("preselects the import type from the file", async () => {
    const { queue } = setup()
    expect(queue.selectedType.value).toBe(null)

    queue.addFile(makeFile(schemeLine, "vocabulary.ndjson"))
    await flushPromises()

    expect(queue.selectedType.value).toBe("schemes")
  })

  it("adds an SSSOM/TSV file as mappings without reading it", async () => {
    const { queue } = setup()
    const file = makeFile(sssomLines, "mappings.sssom.tsv")
    // A read would be the only reason to touch the file's contents.
    const text = vi.spyOn(file, "text")
    queue.addFile(file)
    await flushPromises()

    expect(queue.source.value).toMatchObject({
      kind: "file",
      format: "sssom",
      detectedType: "mappings",
      status: "pending",
    })
    expect(queue.selectedType.value).toBe("mappings")
    expect(text).not.toHaveBeenCalled()
  })

  it("leaves a type the user chose for an SSSOM/TSV file alone", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(sssomLines, "mappings.tsv"))
    await flushPromises()

    queue.selectedType.value = "schemes"

    expect(queue.hasTypeMismatch.value).toBe(true)
    expect(queue.blockedReason.value).toBe(null)
  })

  it("rejects an SSSOM/TSV URL, which the server cannot fetch", () => {
    const { queue } = setup()
    queue.addUrl("https://example.org/mappings.sssom.tsv")

    expect(queue.source.value).toBe(null)
    expect(notify).toHaveBeenCalledWith(
      expect.stringMatching(/mappings\.sssom\.tsv.*as a file/i),
      "warning",
    )
  })

  it("leaves the type unset when it cannot be guessed", async () => {
    const { queue } = setup()
    queue.addFile(makeFile('{"uri":"urn:test"}', "data.json"))
    await flushPromises()

    expect(queue.source.value.detectedType).toBe(null)
    expect(queue.selectedType.value).toBe(null)
  })

  it("reports a mismatch when the source was detected as another type", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(schemeLine, "voc.ndjson"))
    await flushPromises()
    expect(queue.hasTypeMismatch.value).toBe(false)

    queue.selectedType.value = "concepts"

    expect(queue.hasTypeMismatch.value).toBe(true)
  })

  it("reports no mismatch for a source of unknown type", async () => {
    const { queue } = setup()
    queue.addFile(makeFile('{"uri":"urn:test"}', "data.json"))
    await flushPromises()

    queue.selectedType.value = "concepts"

    expect(queue.hasTypeMismatch.value).toBe(false)
  })

  it("cannot detect a type for URLs", () => {
    const { queue } = setup()
    queue.addUrl("https://example.org/voc.ndjson")

    expect(queue.source.value.detectedType).toBe(null)
  })

  it("adds a URL and detects its format from the extension", () => {
    const { queue } = setup()
    queue.addUrl("  https://example.org/voc.ndjson  ")

    expect(queue.source.value).toMatchObject({
      kind: "url",
      url: "https://example.org/voc.ndjson",
      format: "ndjson",
    })
  })

  it("ignores blank URLs", () => {
    const { queue } = setup()
    queue.addUrl("   ")
    expect(queue.source.value).toBe(null)
  })

  it("reports an empty file instead of importing it", () => {
    const { queue } = setup()
    queue.addFile(makeFile("", "empty.json"))

    expect(queue.source.value).toBe(null)
    expect(notify).toHaveBeenCalledWith(
      expect.stringMatching(/empty file: empty\.json/i),
      "warning",
    )
  })

  it("replaces the previous file", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    queue.addFile(makeFile(schemeLine, "b.ndjson"))
    await flushPromises()

    expect(queue.source.value.name).toBe("b.ndjson")
  })

  it("replaces the previous source when a URL is added", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    queue.addUrl("https://example.org/voc.ndjson")

    expect(queue.source.value.kind).toBe("url")
  })

  it("re-detects the type when the source is replaced", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(schemeLine, "scheme.ndjson"))
    await flushPromises()
    expect(queue.selectedType.value).toBe("schemes")

    queue.addFile(
      makeFile(
        '{"uri":"urn:c","type":["http://www.w3.org/2004/02/skos/core#Concept"]}',
        "concept.ndjson",
      ),
    )
    await flushPromises()

    expect(queue.selectedType.value).toBe("concepts")
  })

  it("clears the type when a URL replaces the source", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(schemeLine, "scheme.ndjson"))
    await flushPromises()

    queue.addUrl("https://example.org/api/voc")

    expect(queue.selectedType.value).toBe(null)
  })

  it("keeps a type the user chose during the detection", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(schemeLine, "voc.ndjson"))
    queue.selectedType.value = "concepts"
    await flushPromises()

    expect(queue.selectedType.value).toBe("concepts")
  })

  it("drops the source and its type on reset", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(schemeLine, "voc.ndjson"))
    await flushPromises()

    queue.reset()

    expect(queue.source.value).toBe(null)
    expect(queue.selectedType.value).toBe(null)
    expect(queue.result.value).toBe(null)
  })

  it("keeps bulk mode across a reset", () => {
    const { queue } = setup()
    queue.isBulk.value = true

    queue.reset()

    expect(queue.isBulk.value).toBe(true)
  })

  it("reports a file rejected by the file input", () => {
    const { queue } = setup()
    queue.reportRejectedFile("data.csv")

    expect(notify).toHaveBeenCalledWith(
      expect.stringMatching(/data\.csv.*\.json, \.ndjson, or \.tsv/i),
      "warning",
    )
  })

  it("reports a drop of more than one file", () => {
    const { queue } = setup()
    queue.reportMultipleFiles()

    expect(notify).toHaveBeenCalledWith(
      expect.stringMatching(/only one file/i),
      "warning",
    )
  })
})

describe("type access", () => {
  const authCreate = { supported: true, requiresAuth: true }

  afterEach(() => {
    auth.loggedIn.value = false
  })

  /**
   * Sets up an import whose registries reject every authorization check.
   */
  function setupUnauthorized(capabilities) {
    return setup({
      capabilities,
      registry: { axios: vi.fn(), isAuthorizedFor: () => false },
      mappingsRegistry: { axios: vi.fn(), isAuthorizedFor: () => false },
    })
  }

  it("resolves the access state of every importable type", () => {
    const { queue } = setup()
    expect(queue.typeAccess.value.schemes).toBe("open")
    expect(queue.typeAccess.value.annotations).toBe("unsupported")
  })

  it("keeps the import available while one type is writable", () => {
    const { queue } = setup({
      capabilities: { schemes: { create: openCreate } },
    })
    expect(queue.unavailableReason.value).toBe(null)
  })

  it("reports a server that accepts no imports", () => {
    const { queue } = setup({ capabilities: {} })
    expect(queue.unavailableReason.value.access).toBe("unsupported")
    expect(queue.unavailableReason.value.text).toMatch(
      /does not accept imports/i,
    )
  })

  it("asks for a login when every type requires one", () => {
    const { queue } = setupUnauthorized({ schemes: { create: authCreate } })
    expect(queue.unavailableReason.value.access).toBe("auth-required")
  })

  it("reports a missing authorization once signed in", () => {
    const { queue } = setupUnauthorized({ schemes: { create: authCreate } })
    auth.loggedIn.value = true
    expect(queue.unavailableReason.value.access).toBe("denied")
    expect(queue.unavailableReason.value.text).toMatch(/not authorized/i)
  })

  it("explains a blocked type the detection selected", async () => {
    const { queue } = setup({
      capabilities: { concepts: { create: openCreate } },
    })
    queue.addFile(makeFile(schemeLine, "voc.ndjson"))
    await flushPromises()

    expect(queue.selectedType.value).toBe("schemes")
    expect(queue.blockedReason.value).toMatch(/does not accept imports of/i)
  })
})

describe("the import request", () => {
  it("posts a file as multipart form data in the field 'data'", async () => {
    const { queue, registryMock } = setup()
    queue.addFile(makeFile(schemeLine, "vocabulary.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(registryMock.axios).toHaveBeenCalledTimes(1)
    const request = registryMock.axios.mock.calls[0][0]
    expect(request.method).toBe("post")
    expect(request.url).toBe("http://localhost:3000/voc")
    expect(request.data).toBeInstanceOf(FormData)
    expect(request.data.get("data")).toBeInstanceOf(File)
    expect(request.data.get("data").name).toBe("vocabulary.ndjson")
  })

  it("posts an SSSOM/TSV file raw, declaring it by content type", async () => {
    const { queue, mappingsMock } = setup()
    const file = makeFile(sssomLines, "mappings.sssom.tsv")
    queue.addFile(file)
    await flushPromises()

    await queue.startImport()

    const request = mappingsMock.axios.mock.calls[0][0]
    expect(request.url).toBe("http://localhost:3000/mappings")
    // happy-dom's File lacks Symbol.toStringTag, so Vue wraps it in a reactive
    // proxy here. Browsers tag it as [object File], which Vue leaves alone.
    expect(toRaw(request.data)).toBe(file)
    expect(request.headers).toEqual({
      "Content-Type": "application/sssom+tsv",
    })
  })

  it("leaves the content type of multipart bodies to axios", async () => {
    const { queue, registryMock } = setup()
    queue.addFile(makeFile(schemeLine, "vocabulary.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(registryMock.axios.mock.calls[0][0].headers).toEqual({})
  })

  it("sends bulk mode for an SSSOM/TSV file as well", async () => {
    const { queue, mappingsMock } = setup()
    queue.addFile(makeFile(sssomLines, "mappings.tsv"))
    await flushPromises()
    queue.isBulk.value = true

    await queue.startImport()

    expect(mappingsMock.axios.mock.calls[0][0].params.bulk).toBe(true)
  })

  it("starts at the scheme mode the server applies by default", async () => {
    const { queue, mappingsMock } = setup()
    queue.addFile(makeFile(sssomLines, "mappings.tsv"))
    await flushPromises()

    expect(queue.schemeMode.value).toBe("given")

    await queue.startImport()

    expect(mappingsMock.axios.mock.calls[0][0].params.scheme).toBe("given")
  })

  it("sends the selected scheme mode for an SSSOM/TSV file", async () => {
    const { queue, mappingsMock } = setup()
    queue.addFile(makeFile(sssomLines, "mappings.tsv"))
    await flushPromises()
    queue.schemeMode.value = "lookup"

    await queue.startImport()

    expect(mappingsMock.axios.mock.calls[0][0].params.scheme).toBe("lookup")
  })

  it("keeps exactly one scheme mode selected", () => {
    const { queue } = setup()

    queue.schemeMode.value = "lookup"
    expect(queue.schemeMode.value).toBe("lookup")

    queue.schemeMode.value = "ignore"
    expect(queue.schemeMode.value).toBe("ignore")
  })

  it("offers the scheme modes for SSSOM/TSV files only", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(schemeLine, "vocabulary.ndjson"))
    await flushPromises()
    expect(queue.hasSchemeOptions.value).toBe(false)

    queue.addFile(makeFile(sssomLines, "mappings.tsv"))
    await flushPromises()
    expect(queue.hasSchemeOptions.value).toBe(true)
  })

  it("omits the scheme mode for formats it does not apply to", async () => {
    const { queue, mappingsMock } = setup()
    queue.schemeMode.value = "ignore"
    queue.addFile(makeFile(schemeLine, "vocabulary.ndjson"))
    await flushPromises()
    queue.selectedType.value = "mappings"

    await queue.startImport()

    expect(mappingsMock.axios.mock.calls[0][0].params.scheme).toBeUndefined()
  })

  it("routes concepts to /concepts rather than /voc/concepts", async () => {
    const { queue, registryMock } = setup()
    queue.addFile(
      makeFile(
        '{"uri":"urn:c","type":["http://www.w3.org/2004/02/skos/core#Concept"]}',
        "c.ndjson",
      ),
    )
    await flushPromises()

    await queue.startImport()

    expect(registryMock.axios.mock.calls[0][0].url).toBe(
      "http://localhost:3000/concepts",
    )
  })

  it("uses the mappings registry for mapping types", async () => {
    const { queue, registryMock, mappingsMock } = setup()
    queue.addUrl("https://example.org/mappings.ndjson")
    queue.selectedType.value = "mappings"

    await queue.startImport()

    expect(registryMock.axios).not.toHaveBeenCalled()
    expect(mappingsMock.axios).toHaveBeenCalledTimes(1)
  })

  it("hands a URL to the server instead of a body", async () => {
    const { queue, registryMock } = setup()
    queue.addUrl("https://example.org/voc.ndjson")
    queue.selectedType.value = "schemes"

    await queue.startImport()

    const request = registryMock.axios.mock.calls[0][0]
    expect(request.data).toBe(null)
    expect(request.params).toMatchObject({
      url: "https://example.org/voc.ndjson",
      type: "ndjson",
    })
  })

  it("omits the format for URLs without a recognizable extension", async () => {
    const { queue, registryMock } = setup()
    queue.addUrl("https://example.org/api/voc")
    queue.selectedType.value = "schemes"

    await queue.startImport()

    expect(registryMock.axios.mock.calls[0][0].params.type).toBeUndefined()
  })

  it("omits bulk mode while it is off", async () => {
    const { queue, registryMock } = setup()
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(registryMock.axios.mock.calls[0][0].params.bulk).toBeUndefined()
  })

  it("sends bulk mode when it is on", async () => {
    const { queue, registryMock } = setup()
    queue.isBulk.value = true
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(registryMock.axios.mock.calls[0][0].params.bulk).toBe(true)
  })

  it("keeps the imported record and the type it was written as", async () => {
    const scheme = {
      uri: "urn:test:scheme",
      prefLabel: { en: "Test Vocabulary" },
    }
    const { queue } = setup({ registry: makeRegistry(scheme) })
    queue.addFile(makeFile(schemeLine, "vocabulary.json"))
    await flushPromises()

    await queue.startImport()

    expect(queue.source.value.status).toBe("done")
    expect(queue.source.value.result).toEqual({
      type: "schemes",
      count: 1,
      records: [scheme],
    })
  })

  it("counts the records of a bulk response", async () => {
    const registry = makeRegistry([{ uri: "urn:a" }, { uri: "urn:b" }])
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "vocabulary.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(queue.source.value.result.count).toBe(2)
  })

  it("keeps only the first records of a large import", async () => {
    const records = Array.from({ length: 250 }, (_, index) => ({
      uri: `urn:concept:${index}`,
    }))
    const { queue } = setup({ registry: makeRegistry(records) })
    queue.addFile(makeFile(schemeLine, "vocabulary.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(queue.source.value.result.count).toBe(250)
    expect(queue.source.value.result.records).toHaveLength(10)
    expect(queue.source.value.result.records[0]).toEqual(records[0])
  })

  it("reports an authorization failure in plain words", async () => {
    const registry = makeRegistry()
    registry.axios.mockRejectedValue({
      response: { status: 403 },
      message: "x",
    })
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(queue.source.value.status).toBe("failed")
    expect(queue.source.value.error).toMatch(/not authorized/i)
  })

  it("surfaces the server's own validation message", async () => {
    const registry = makeRegistry()
    registry.axios.mockRejectedValue({
      response: { status: 422, data: { message: "Invalid scheme." } },
      message: "Request failed",
    })
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(queue.source.value.error).toMatch(/Invalid scheme\./)
  })

  it("reports an unreachable server separately from a rejection", async () => {
    const registry = makeRegistry()
    registry.axios.mockRejectedValue(new Error("Network Error"))
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(queue.source.value.errorKind).toBe("network")
    expect(queue.source.value.error).toMatch(/could not reach the server/i)
  })

  it("treats an empty bulk response as a failure", async () => {
    const registry = makeRegistry([])
    const { queue } = setup({ registry })
    queue.isBulk.value = true
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(queue.source.value.status).toBe("failed")
    expect(queue.source.value.errorKind).toBe("empty")
    expect(queue.source.value.error).toMatch(/discarded every entry/i)
  })

  it("treats an empty non-bulk response as a failure", async () => {
    const registry = makeRegistry(null)
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(queue.source.value.status).toBe("failed")
    expect(queue.source.value.error).toMatch(/no records/i)
  })

  it("does not treat a URI as the imported record's name", async () => {
    const registry = makeRegistry([{ uri: "urn:test:scheme" }])
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(notify).toHaveBeenCalledWith("Imported 1 record.", "success")
  })
})

describe("startImport", () => {
  it("imports nothing while the chosen type is not permitted", async () => {
    const registry = makeRegistry()
    registry.isAuthorizedFor = vi.fn(() => false)
    const { queue, registryMock } = setup({
      registry,
      capabilities: {
        concepts: { create: { supported: true, requiresAuth: true } },
      },
    })
    queue.addFile(
      makeFile(
        '{"uri":"urn:c","type":["http://www.w3.org/2004/02/skos/core#Concept"]}',
        "concept.ndjson",
      ),
    )
    await flushPromises()

    expect(queue.selectedType.value).toBe("concepts")
    expect(queue.blockedReason.value).toMatch(/sign.?in/i)
    expect(queue.canImport.value).toBe(true)

    await queue.startImport()

    expect(registryMock.axios).not.toHaveBeenCalled()
    expect(queue.source.value.status).toBe("pending")
  })

  it("imports the source once the type is permitted", async () => {
    const { queue, registryMock } = setup()
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(registryMock.axios).toHaveBeenCalledTimes(1)
    expect(queue.source.value.status).toBe("done")
  })

  it("reports a missing type instead of guessing", async () => {
    const { queue, registryMock } = setup()
    queue.addUrl("https://example.org/api/voc")

    await queue.startImport()

    expect(registryMock.axios).not.toHaveBeenCalled()
    expect(queue.blockedReason.value).toMatch(/content type/i)
  })

  it("notifies about failures with the server's message", async () => {
    const registry = makeRegistry()
    registry.axios.mockRejectedValue({
      response: { status: 500 },
      message: "boom",
    })
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(notify).toHaveBeenCalledWith("boom", "danger")
  })

  it("notifies about success", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(notify).toHaveBeenCalledWith("Imported 1 record.", "success")
  })

  it("names the record that was imported", async () => {
    const registry = makeRegistry({
      uri: "urn:test:scheme",
      prefLabel: { en: "Test Vocabulary" },
    })
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.json"))
    await flushPromises()

    await queue.startImport()

    expect(notify).toHaveBeenCalledWith(
      'Imported "Test Vocabulary".',
      "success",
    )
  })

  it("counts the imported records when the response carries no name", async () => {
    const registry = makeRegistry([{ uri: "urn:a" }, { uri: "urn:b" }])
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(notify).toHaveBeenCalledWith("Imported 2 records.", "success")
  })

  it("has no result before an import succeeded", async () => {
    const { queue } = setup()
    expect(queue.result.value).toBe(null)

    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    expect(queue.result.value).toBe(null)
  })

  it("exposes the result of a finished import", async () => {
    const { queue } = setup()
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(queue.result.value).toEqual({
      type: "schemes",
      count: 1,
      records: [{ uri: "urn:imported" }],
    })
  })

  it("points at signing in again when authorization failed", async () => {
    const registry = makeRegistry()
    registry.axios.mockRejectedValue({ response: { status: 401 } })
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(notify).toHaveBeenCalledWith(
      expect.stringMatching(/Sign in again and retry/),
      "danger",
    )
  })

  it("points at the connection when the server was unreachable", async () => {
    const registry = makeRegistry()
    registry.axios.mockRejectedValue(new Error("Network Error"))
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()

    expect(notify).toHaveBeenCalledWith(
      expect.stringMatching(/could not reach the server/i),
      "danger",
    )
  })

  it("keeps a failed source importable so it can be retried", async () => {
    const registry = makeRegistry()
    registry.axios.mockRejectedValueOnce({
      response: { status: 500 },
      message: "boom",
    })
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()
    expect(queue.source.value.status).toBe("failed")
    expect(queue.canImport.value).toBe(true)

    await queue.startImport()

    expect(queue.source.value.status).toBe("done")
    expect(queue.source.value.error).toBe(null)
    expect(queue.canImport.value).toBe(false)
  })

  it("does not import the source again once it succeeded", async () => {
    const { queue, registryMock } = setup()
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    await queue.startImport()
    await queue.startImport()

    expect(registryMock.axios).toHaveBeenCalledTimes(1)
  })
})

describe("cancelImport", () => {
  /**
   * Builds a registry that rejects with an abort as soon as its signal fires.
   */
  function makeAbortableRegistry() {
    return {
      isAuthorizedFor: vi.fn(() => true),
      axios: vi.fn(
        ({ signal }) =>
          new Promise((resolve, reject) => {
            signal.addEventListener("abort", () => {
              const error = new Error("canceled")
              error.code = "ERR_CANCELED"
              reject(error)
            })
          }),
      ),
    }
  }

  it("passes an abort signal to the request", async () => {
    const registry = makeAbortableRegistry()
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    const running = queue.startImport()
    await flushPromises()

    expect(registry.axios.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal)

    queue.cancelImport()
    await running
  })

  it("returns the source to pending instead of failing it", async () => {
    const registry = makeAbortableRegistry()
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    const running = queue.startImport()
    await flushPromises()
    queue.cancelImport()
    await running

    expect(queue.source.value.status).toBe("pending")
    expect(queue.source.value.error).toBe(null)
    expect(queue.canImport.value).toBe(true)
    expect(notify).toHaveBeenCalledWith("Import canceled.", "warning")
  })

  it("lets a canceled import be started again", async () => {
    const registry = makeAbortableRegistry()
    const { queue } = setup({ registry })
    queue.addFile(makeFile(schemeLine, "a.ndjson"))
    await flushPromises()

    const running = queue.startImport()
    await flushPromises()
    queue.cancelImport()
    await running

    registry.axios.mockResolvedValueOnce([{ uri: "urn:a" }])
    await queue.startImport()

    expect(queue.source.value.status).toBe("done")
    expect(registry.axios).toHaveBeenCalledTimes(2)
  })

  it("does nothing while no import is running", () => {
    const { queue } = setup()
    expect(() => queue.cancelImport()).not.toThrow()
  })
})
