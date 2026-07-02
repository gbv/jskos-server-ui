import { parseCapabilities } from "@/utils/capabilities"

describe("parseCapabilities(config)", () => {
  it("returns all eight types as null when config is null or undefined", () => {
    const nullResult = parseCapabilities({ _config: null })
    const undefinedResult = parseCapabilities({ _config: undefined })
    const expected = {
      annotations: null,
      concepts: null,
      concordances: null,
      mappings: null,
      occurrences: null,
      registries: null,
      schemes: null,
      types: null,
    }
    expect(nullResult).toEqual(expected)
    expect(undefinedResult).toEqual(expected)
  })

  it("sets absent type to null and present type to an object", () => {
    const result = parseCapabilities({ _config: { schemes: { read: {} } } })
    expect(result.schemes).not.toBeNull()
    expect(result.concepts).toBeNull()
    expect(result.mappings).toBeNull()
  })

  it("sets absent action to null and present action without auth to { supported: true, requiresAuth: false }", () => {
    const result = parseCapabilities({ _config: { schemes: { read: {} } } })
    expect(result.schemes.read).toEqual({
      supported: true,
      requiresAuth: false,
    })
    expect(result.schemes.create).toBeNull()
  })

  it("maps action with auth: true to { supported: true, requiresAuth: true }", () => {
    const result = parseCapabilities({ _config: { schemes: { create: { auth: true } } } })
    expect(result.schemes.create).toEqual({
      supported: true,
      requiresAuth: true,
    })
  })

  it("includes exactly the expected types", () => {
    expect(Object.keys(parseCapabilities({})).sort()).toEqual([
      "annotations",
      "concepts",
      "concordances",
      "mappings",
      "occurrences",
      "registries",
      "schemes",
      "types",
    ])
  })

  it("includes exactly the four actions per non-null type", () => {
    const result = parseCapabilities({ _config: {
      schemes: { read: {}, create: {}, update: {}, delete: {} },
    } })
    expect(Object.keys(result.schemes).sort()).toEqual([
      "create",
      "delete",
      "read",
      "update",
    ])
  })

  it("correctly parses a mixed real-world config", () => {
    const _config = {
      schemes: { read: {}, create: { auth: true } },
      mappings: {
        read: {},
        create: { auth: true },
        update: { auth: true },
        delete: { auth: true },
      },
      annotations: { read: {}, create: { auth: true } },
    }
    const result = parseCapabilities({_config})
    expect(result.schemes.read).toEqual({
      supported: true,
      requiresAuth: false,
    })
    expect(result.schemes.create).toEqual({
      supported: true,
      requiresAuth: true,
    })
    expect(result.schemes.update).toBeNull()
    expect(result.concepts).toBeNull()
    expect(result.concordances).toBeNull()
    expect(result.annotations.create).toEqual({
      supported: true,
      requiresAuth: true,
    })
  })
})
