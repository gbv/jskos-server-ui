import {
  describeImportError,
  importBlockedReason,
  importEmptyMessage,
  importFailureMessage,
  importSuccessMessage,
  importTypeOptionLabel,
  importUnavailableReason,
} from "@/utils/importMessages"

describe("importBlockedReason", () => {
  it("asks for a type when none is chosen", () => {
    expect(importBlockedReason(null, null)).toMatch(/content type/i)
  })

  it("reports an unsupported type with its label", () => {
    expect(importBlockedReason("schemes", "unsupported")).toMatch(
      /Terminologies/,
    )
  })

  it("distinguishes missing login from missing permission", () => {
    expect(importBlockedReason("schemes", "auth-required")).toMatch(/sign.?in/i)
    expect(importBlockedReason("schemes", "denied")).toMatch(/not authorized/i)
  })

  it("returns null when the import may proceed", () => {
    expect(importBlockedReason("schemes", "open")).toBe(null)
  })
})

describe("importSuccessMessage", () => {
  it("names the stored record when the server reported one", () => {
    expect(
      importSuccessMessage({
        count: 1,
        records: [{ uri: "urn:test", prefLabel: { en: "Test Vocabulary" } }],
      }),
    ).toBe('Imported "Test Vocabulary".')
  })

  it("counts the records when no name was reported", () => {
    expect(
      importSuccessMessage({ count: 1, records: [{ uri: "urn:test" }] }),
    ).toBe("Imported 1 record.")
    expect(
      importSuccessMessage({
        count: 2481,
        records: [{ uri: "urn:test", prefLabel: { en: "Test Vocabulary" } }],
      }),
    ).toBe("Imported 2,481 records.")
  })
})

describe("importTypeOptionLabel", () => {
  it("leaves a writable type alone", () => {
    expect(importTypeOptionLabel("Terminologies", "open")).toBe("Terminologies")
  })

  it("names why a type cannot be picked", () => {
    expect(importTypeOptionLabel("Terminologies", "unsupported")).toBe(
      "Terminologies (not supported)",
    )
    expect(importTypeOptionLabel("Terminologies", "auth-required")).toBe(
      "Terminologies (sign-in required)",
    )
    expect(importTypeOptionLabel("Terminologies", "denied")).toBe(
      "Terminologies (not authorized)",
    )
  })
})

describe("importUnavailableReason", () => {
  it("returns null as soon as one type can be written", () => {
    expect(
      importUnavailableReason({ schemes: "open", concepts: "unsupported" }),
    ).toBe(null)
  })

  it("reports a server without any import endpoint", () => {
    const unavailable = importUnavailableReason({
      schemes: "unsupported",
      concepts: "unsupported",
    })
    expect(unavailable.access).toBe("unsupported")
    expect(unavailable.text).toMatch(/does not accept imports/i)
  })

  it("asks for a login when every type needs one", () => {
    const unavailable = importUnavailableReason({
      schemes: "auth-required",
      concepts: "auth-required",
    })
    expect(unavailable.access).toBe("auth-required")
    expect(unavailable.title).toMatch(/sign in/i)
  })

  it("reports a missing authorization", () => {
    const unavailable = importUnavailableReason({
      schemes: "denied",
      concepts: "denied",
    })
    expect(unavailable.access).toBe("denied")
    expect(unavailable.text).toMatch(/not authorized/i)
  })

  // Signing in is actionable, being denied is not.
  it("prefers the login hint over a denial", () => {
    expect(
      importUnavailableReason({
        schemes: "denied",
        concepts: "auth-required",
        mappings: "unsupported",
      }).access,
    ).toBe("auth-required")
  })
})

describe("describeImportError", () => {
  it("classifies a rejected authorization", () => {
    expect(describeImportError({ response: { status: 403 } })).toEqual({
      kind: "auth",
      message: "You are not authorized to import this data.",
    })
    expect(describeImportError({ response: { status: 401 } }).kind).toBe("auth")
  })

  it("classifies an unreachable server", () => {
    const described = describeImportError(new Error("Network Error"))

    expect(described.kind).toBe("network")
    expect(described.message).toMatch(/Network Error/)
  })

  it("passes the server's own validation message through", () => {
    const described = describeImportError({
      response: { status: 422, data: { message: "Invalid JSKOS entity." } },
    })

    expect(described.kind).toBe("rejected")
    expect(described.message).toMatch(/Invalid JSKOS entity\./)
  })

  it("explains a missing scheme on an SSSOM source", () => {
    const described = describeImportError(
      {
        response: {
          status: 422,
          data: { message: "Property `fromScheme` is missing." },
        },
      },
      "sssom",
    )

    expect(described.kind).toBe("rejected")
    expect(described.message).toMatch(/Property `fromScheme` is missing\./)
    expect(described.message).toMatch(/subject_source/)
  })

  it("leaves the same rejection alone for JSKOS sources", () => {
    const described = describeImportError(
      {
        response: {
          status: 422,
          data: { message: "Property `fromScheme` is missing." },
        },
      },
      "ndjson",
    )

    expect(described.message).toBe(
      "The server rejected the data: Property `fromScheme` is missing.",
    )
  })

  it("adds no scheme hint to other SSSOM rejections", () => {
    const described = describeImportError(
      {
        response: {
          status: 400,
          data: { message: "Could not parse SSSOM/TSV." },
        },
      },
      "sssom",
    )

    expect(described.message).toBe(
      "The server rejected the data: Could not parse SSSOM/TSV.",
    )
  })

  it("falls back to the plain error for other responses", () => {
    expect(
      describeImportError({
        message: "Request failed with status code 500",
        response: { status: 500 },
      }),
    ).toEqual({ kind: "other", message: "Request failed with status code 500" })
  })
})

describe("importFailureMessage", () => {
  it("points at signing in again after an authorization failure", () => {
    expect(
      importFailureMessage({ error: "Not authorized.", errorKind: "auth" }),
    ).toBe("Not authorized. Sign in again and retry.")
  })

  it("leaves other failures as reported", () => {
    expect(
      importFailureMessage({ error: "Could not reach.", errorKind: "network" }),
    ).toBe("Could not reach.")
  })
})

describe("importEmptyMessage", () => {
  it("blames the discarded entries in bulk mode", () => {
    expect(importEmptyMessage(true)).toMatch(/discarded/)
  })

  it("blames the empty source otherwise", () => {
    expect(importEmptyMessage(false)).toMatch(/no records/)
  })
})
