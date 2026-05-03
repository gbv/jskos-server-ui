import { parseCapabilities } from "@/utils/capabilities"

describe("parseCapabilities(config)", () => {
  it("returns all six types as null when config is null or undefined", () => {
    const nullResult = parseCapabilities(null)
    const undefinedResult = parseCapabilities(undefined)
    const expected = {
      schemes: null,
      concepts: null,
      mappings: null,
      concordances: null,
      annotations: null,
      registries: null,
    }
    expect(nullResult).toEqual(expected)
    expect(undefinedResult).toEqual(expected)
  })

  it("sets absent type to null and present type to an object", () => {
    const result = parseCapabilities({ schemes: { read: {} } })
    expect(result.schemes).not.toBeNull()
    expect(result.concepts).toBeNull()
    expect(result.mappings).toBeNull()
  })

  it("sets absent action to null and present action without auth to { supported: true, requiresAuth: false }", () => {
    const result = parseCapabilities({ schemes: { read: {} } })
    expect(result.schemes.read).toEqual({
      supported: true,
      requiresAuth: false,
    })
    expect(result.schemes.create).toBeNull()
  })

  it("maps action with auth: true to { supported: true, requiresAuth: true }", () => {
    const result = parseCapabilities({ schemes: { create: { auth: true } } })
    expect(result.schemes.create).toEqual({
      supported: true,
      requiresAuth: true,
    })
  })

  it("includes exactly the six expected types", () => {
    expect(Object.keys(parseCapabilities({})).sort()).toEqual([
      "annotations",
      "concepts",
      "concordances",
      "mappings",
      "registries",
      "schemes",
    ])
  })

  it("includes exactly the four actions per non-null type", () => {
    const result = parseCapabilities({
      schemes: { read: {}, create: {}, update: {}, delete: {} },
    })
    expect(Object.keys(result.schemes).sort()).toEqual([
      "create",
      "delete",
      "read",
      "update",
    ])
  })

  it("correctly parses a mixed real-world config", () => {
    const config = {
      schemes: { read: {}, create: { auth: true } },
      mappings: {
        read: {},
        create: { auth: true },
        update: { auth: true },
        delete: { auth: true },
      },
      annotations: { read: {}, create: { auth: true } },
    }
    const result = parseCapabilities(config)
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
