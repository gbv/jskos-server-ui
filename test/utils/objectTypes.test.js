import { OBJECT_TYPES, getObjectType, isBrowsable } from "@/utils/objectTypes"

describe("objectTypes", () => {
  it("treats exactly the types with a route as browsable", () => {
    for (const [key, config] of Object.entries(OBJECT_TYPES)) {
      expect(isBrowsable(key)).toBe(Boolean(config.route))
    }
  })

  it("routes item types to the main registry and mapping types to the mappings registry", () => {
    expect(OBJECT_TYPES.schemes.registry).toBe("registry")
    expect(OBJECT_TYPES.concepts.registry).toBe("registry")
    expect(OBJECT_TYPES.registries.registry).toBe("registry")
    expect(OBJECT_TYPES.mappings.registry).toBe("mappingsRegistry")
    expect(OBJECT_TYPES.concordances.registry).toBe("mappingsRegistry")
    expect(OBJECT_TYPES.annotations.registry).toBe("mappingsRegistry")
  })

  it("exposes a count method for counted types and null for uncounted ones", () => {
    expect(OBJECT_TYPES.schemes.count).toBe("getSchemes")
    expect(OBJECT_TYPES.concepts.count).toBe("getConcepts")
    expect(OBJECT_TYPES.registries.count).toBe("getRegistries")
    expect(OBJECT_TYPES.occurrences.count).toBeNull()
  })

  it("routes browsable types to their list endpoint and hierarchy setting", () => {
    expect(OBJECT_TYPES.mappings.list).toBe("getMappings")
    expect(OBJECT_TYPES.mappings.hierarchical).toBe(false)
    expect(OBJECT_TYPES.concepts.list).toBeNull()
    expect(OBJECT_TYPES.concepts.hierarchical).toBe(true)
  })

  it("selects the flat list renderer via the listComponent key", () => {
    expect(OBJECT_TYPES.schemes.listComponent).toBe("items")
    expect(OBJECT_TYPES.concepts.listComponent).toBe("items")
    expect(OBJECT_TYPES.mappings.listComponent).toBe("mappings")
    expect(OBJECT_TYPES.concordances.listComponent).toBe("concordances")
    expect(OBJECT_TYPES.annotations.listComponent).toBe("annotations")
  })

  it("selects the detail renderer via the detailComponent key", () => {
    expect(OBJECT_TYPES.schemes.detailComponent).toBe("item")
    expect(OBJECT_TYPES.concepts.detailComponent).toBe("item")
    expect(OBJECT_TYPES.mappings.detailComponent).toBe("mapping")
    expect(OBJECT_TYPES.concordances.detailComponent).toBe("concordance")
    expect(OBJECT_TYPES.annotations.detailComponent).toBe("annotation")
  })

  it("deep-links URI-resolvable items and keeps other records in memory", () => {
    expect(OBJECT_TYPES.schemes.selection).toBe("url")
    expect(OBJECT_TYPES.concepts.selection).toBe("url")
    expect(OBJECT_TYPES.mappings.selection).toBe("memory")
    expect(OBJECT_TYPES.concordances.selection).toBe("memory")
    expect(OBJECT_TYPES.annotations.selection).toBe("memory")
  })

  it("returns the entry or null via getObjectType", () => {
    expect(getObjectType("nope")).toBeNull()
    expect(getObjectType("schemes")).toBe(OBJECT_TYPES.schemes)
  })
})
