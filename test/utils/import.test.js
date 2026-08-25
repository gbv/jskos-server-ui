import {
  IMPORTABLE_TYPES,
  SCHEME_MODES,
  ACCEPTED_FILE_TYPES,
  ACCEPTED_FILE_TYPES_HINT,
  resolveImportUrl,
  resolveDataUrl,
  recordLabel,
  detectFormat,
  extractFirstObject,
  guessType,
  isCanceled,
  readSample,
  summarizeResult,
  MAX_LISTED_RECORDS,
} from "@/utils/import"
import { OBJECT_TYPES } from "@/utils/objectTypes"

describe("IMPORTABLE_TYPES", () => {
  it("holds every object type with a write endpoint", () => {
    expect(IMPORTABLE_TYPES).toEqual([
      "schemes",
      "concepts",
      "mappings",
      "concordances",
      "annotations",
      "registries",
    ])
  })

  it("leaves out types that cannot be written", () => {
    expect(IMPORTABLE_TYPES).not.toContain("occurrences")
    expect(OBJECT_TYPES.occurrences.importPath).toBeUndefined()
  })
})

describe("resolveImportUrl", () => {
  it("writes concept schemes to /voc", () => {
    expect(resolveImportUrl("http://localhost:3000/", "schemes")).toBe(
      "http://localhost:3000/voc",
    )
  })

  it("writes concepts to /concepts, not /voc/concepts", () => {
    expect(resolveImportUrl("http://localhost:3000/", "concepts")).toBe(
      "http://localhost:3000/concepts",
    )
  })

  it("keeps a base URL with a sub path intact", () => {
    expect(resolveImportUrl("https://example.org/api", "mappings")).toBe(
      "https://example.org/api/mappings",
    )
  })

  it("collapses repeated slashes between base and path", () => {
    expect(resolveImportUrl("https://example.org/api///", "annotations")).toBe(
      "https://example.org/api/annotations",
    )
  })

  it("throws for a type that cannot be imported", () => {
    expect(() =>
      resolveImportUrl("http://localhost:3000/", "occurrences"),
    ).toThrow()
    expect(() =>
      resolveImportUrl("http://localhost:3000/", "nonsense"),
    ).toThrow()
  })
})

describe("resolveDataUrl", () => {
  it("points at the server's data endpoint", () => {
    expect(resolveDataUrl("http://localhost:3000/", "urn:test:scheme")).toBe(
      "http://localhost:3000/data?uri=urn%3Atest%3Ascheme",
    )
  })

  it("escapes a URI that would otherwise break the query", () => {
    expect(
      resolveDataUrl("https://example.org/api", "http://bartoc.org/en/node/18"),
    ).toBe(
      "https://example.org/api/data?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F18",
    )
  })
})

describe("recordLabel", () => {
  it("joins notation and label the way ItemName renders them", () => {
    expect(
      recordLabel({
        uri: "urn:test",
        notation: ["ddc"],
        prefLabel: { en: "Dewey Decimal Classification" },
        type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
      }),
    ).toBe("DDC Dewey Decimal Classification")
  })

  it("names a record that only carries a notation", () => {
    expect(recordLabel({ uri: "urn:test", notation: ["rvk"] })).toBe("rvk")
  })

  it("names a record that only carries a label", () => {
    expect(recordLabel({ uri: "urn:test", prefLabel: { en: "Test" } })).toBe(
      "Test",
    )
  })

  // A bulk import reports URIs only, which are not names.
  it("reports no name for a bare URI", () => {
    expect(recordLabel({ uri: "urn:test" })).toBe("")
    expect(recordLabel(null)).toBe("")
  })
})

describe("detectFormat", () => {
  it("detects json and ndjson from file names", () => {
    expect(detectFormat("vocabulary.json")).toBe("json")
    expect(detectFormat("concepts.ndjson")).toBe("ndjson")
  })

  it("detects sssom from the tsv extension", () => {
    expect(detectFormat("mappings.tsv")).toBe("sssom")
    expect(detectFormat("mappings.sssom.tsv")).toBe("sssom")
  })

  it("is case insensitive", () => {
    expect(detectFormat("VOCABULARY.JSON")).toBe("json")
    expect(detectFormat("MAPPINGS.TSV")).toBe("sssom")
  })

  it("ignores query strings and fragments on URLs", () => {
    expect(detectFormat("https://example.org/voc.ndjson?v=2")).toBe("ndjson")
    expect(detectFormat("https://example.org/voc.json#top")).toBe("json")
  })

  it("returns null for unknown or missing extensions", () => {
    expect(detectFormat("data.csv")).toBe(null)
    expect(detectFormat("https://example.org/api/voc")).toBe(null)
    expect(detectFormat("")).toBe(null)
  })

  it("covers the extensions offered to the file input", () => {
    ACCEPTED_FILE_TYPES.split(",").forEach((extension) => {
      expect(detectFormat(`file${extension}`)).not.toBe(null)
    })
  })
})

describe("ACCEPTED_FILE_TYPES_HINT", () => {
  it("names every accepted extension", () => {
    ACCEPTED_FILE_TYPES.split(",").forEach((extension) => {
      expect(ACCEPTED_FILE_TYPES_HINT).toContain(extension)
    })
  })

  it("joins the extensions into a readable list", () => {
    expect(ACCEPTED_FILE_TYPES_HINT).toBe(".json, .ndjson, or .tsv")
  })
})

describe("extractFirstObject", () => {
  it("reads a single object", () => {
    expect(extractFirstObject('{"uri":"urn:test"}', "json")).toEqual({
      uri: "urn:test",
    })
  })

  it("reads the first element of an array", () => {
    expect(extractFirstObject('[{"uri":"a"},{"uri":"b"}]', "json")).toEqual({
      uri: "a",
    })
  })

  it("reads the first line of NDJSON", () => {
    expect(extractFirstObject('{"uri":"a"}\n{"uri":"b"}\n', "ndjson")).toEqual({
      uri: "a",
    })
  })

  it("tolerates blank lines and carriage returns before the first record", () => {
    expect(
      extractFirstObject('\n\n{"uri":"a"}\r\n{"uri":"b"}', "ndjson"),
    ).toEqual({ uri: "a" })
  })

  it("handles nested objects", () => {
    expect(
      extractFirstObject(
        '[{"uri":"a","inScheme":[{"uri":"s"}]},{"uri":"b"}]',
        "json",
      ),
    ).toEqual({ uri: "a", inScheme: [{ uri: "s" }] })
  })

  it("returns null for an incomplete sample", () => {
    const truncated = '[{"uri":"a"},{"uri":"b","prefLabel":{"de":"unfinis'
    expect(extractFirstObject(truncated, "json")).toBe(null)
  })

  it("returns null when nothing parsable is present", () => {
    expect(extractFirstObject("not json at all", "json")).toBe(null)
    expect(extractFirstObject("", "json")).toBe(null)
    expect(extractFirstObject("", "ndjson")).toBe(null)
  })

  it("returns null when the source holds no objects", () => {
    expect(extractFirstObject("[]", "json")).toBe(null)
    expect(extractFirstObject('["a","b"]', "json")).toBe(null)
    expect(extractFirstObject("42", "json")).toBe(null)
  })
})

describe("guessType", () => {
  it("reads the type property of every importable type", () => {
    expect(
      guessType({
        uri: "urn:s",
        type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
      }),
    ).toBe("schemes")
    expect(
      guessType({
        uri: "urn:c",
        type: ["http://www.w3.org/2004/02/skos/core#Concept"],
      }),
    ).toBe("concepts")
    expect(
      guessType({ type: ["http://www.w3.org/2004/02/skos/core#exactMatch"] }),
    ).toBe("mappings")
    expect(
      guessType({
        uri: "urn:concordance",
        type: ["http://rdf-vocabulary.ddialliance.org/xkos#Correspondence"],
      }),
    ).toBe("concordances")
    expect(guessType({ target: "urn:mapping", type: "Annotation" })).toBe(
      "annotations",
    )
    expect(
      guessType({ uri: "urn:r", type: ["http://www.w3.org/ns/dcat#Catalog"] }),
    ).toBe("registries")
  })

  it("returns null without a type property", () => {
    expect(guessType({ uri: "urn:c", inScheme: [{ uri: "urn:s" }] })).toBe(null)
    expect(
      guessType({ fromScheme: { uri: "urn:s1" }, toScheme: { uri: "urn:s2" } }),
    ).toBe(null)
    expect(guessType({ uri: "urn:test" })).toBe(null)
  })

  it("returns null for a type that cannot be imported", () => {
    expect(
      guessType({ type: ["http://www.w3.org/ns/dcat#Distribution"] }),
    ).toBe(null)
  })

  it("returns null for anything that is not an object", () => {
    expect(guessType(null)).toBe(null)
    expect(guessType("string")).toBe(null)
  })
})

describe("readSample", () => {
  it("reads a JSON file as a whole so its array parses", async () => {
    const content = '[{"uri":"a"},{"uri":"b"}]'
    const file = new File([content], "voc.json")
    expect(await readSample(file, "json")).toBe(content)
  })

  it("reads only the beginning of an NDJSON file", async () => {
    const line = `{"uri":"${"x".repeat(100)}"}`
    const file = new File([Array(2000).fill(line).join("\n")], "voc.ndjson")
    const sample = await readSample(file, "ndjson")

    expect(sample.length).toBeLessThan(file.size)
    expect(extractFirstObject(sample, "ndjson")).toEqual({
      uri: "x".repeat(100),
    })
  })
})

describe("summarizeResult", () => {
  it("counts the records of an array response", () => {
    expect(summarizeResult([{ uri: "a" }, { uri: "b" }], "schemes")).toEqual({
      type: "schemes",
      count: 2,
      records: [{ uri: "a" }, { uri: "b" }],
    })
  })

  it("counts a single object as one record", () => {
    expect(summarizeResult({ uri: "a" }, "schemes").count).toBe(1)
  })

  it("counts an empty response as nothing imported", () => {
    expect(summarizeResult(null, "schemes").count).toBe(0)
    expect(summarizeResult([], "schemes").records).toEqual([])
  })

  it("keeps only the first records of a large import", () => {
    const response = Array.from({ length: 500 }, (_, index) => ({
      uri: `urn:test:${index}`,
    }))
    const result = summarizeResult(response, "concepts")

    expect(result.count).toBe(500)
    expect(result.records).toHaveLength(MAX_LISTED_RECORDS)
    expect(result.records[0].uri).toBe("urn:test:0")
  })
})

describe("isCanceled", () => {
  it("recognizes the abort of every client in use", () => {
    expect(isCanceled({ code: "ERR_CANCELED" })).toBe(true)
    expect(isCanceled({ name: "CanceledError" })).toBe(true)
    expect(isCanceled({ name: "AbortError" })).toBe(true)
  })

  it("leaves other failures alone", () => {
    expect(isCanceled(new Error("Network Error"))).toBe(false)
  })
})

describe("SCHEME_MODES", () => {
  it("names the values jskos-server accepts for its scheme parameter", () => {
    expect(SCHEME_MODES.map((mode) => mode.value)).toEqual([
      "given",
      "lookup",
      "ignore",
    ])
  })

  it("labels and describes every mode", () => {
    for (const mode of SCHEME_MODES) {
      expect(mode.label).toBeTruthy()
      expect(mode.description).toBeTruthy()
    }
  })
})
