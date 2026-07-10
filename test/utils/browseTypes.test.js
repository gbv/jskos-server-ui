import { BROWSE_TYPES, getBrowseType } from "@/utils/browseTypes"

describe("browseTypes", () => {
  it("exposes the browsable types with a matching capability key", () => {
    const keys = Object.keys(BROWSE_TYPES)
    expect(keys).toEqual([
      "schemes",
      "concepts",
      "mappings",
      "concordances",
      "annotations",
    ])
    for (const key of keys) {
      expect(BROWSE_TYPES[key].capability).toBe(key)
    }
  })

  it("routes item types to the main registry", () => {
    expect(BROWSE_TYPES.schemes.registry).toBe("registry")
    expect(BROWSE_TYPES.concepts.registry).toBe("registry")
  })

  it("routes mappings to the mappings registry via its list endpoint", () => {
    expect(BROWSE_TYPES.mappings.registry).toBe("mappingsRegistry")
    expect(BROWSE_TYPES.mappings.list).toBe("getMappings")
    expect(BROWSE_TYPES.mappings.hierarchical).toBe(false)
  })

  it("routes concordances to the mappings registry via its list endpoint", () => {
    expect(BROWSE_TYPES.concordances.registry).toBe("mappingsRegistry")
    expect(BROWSE_TYPES.concordances.list).toBe("getConcordances")
    expect(BROWSE_TYPES.concordances.hierarchical).toBe(false)
  })

  it("routes annotations to the mappings registry via its list endpoint", () => {
    expect(BROWSE_TYPES.annotations.registry).toBe("mappingsRegistry")
    expect(BROWSE_TYPES.annotations.list).toBe("getAnnotations")
    expect(BROWSE_TYPES.annotations.hierarchical).toBe(false)
  })

  it("selects the flat list renderer via the listComponent key", () => {
    expect(BROWSE_TYPES.schemes.listComponent).toBe("items")
    expect(BROWSE_TYPES.concepts.listComponent).toBe("items")
    expect(BROWSE_TYPES.mappings.listComponent).toBe("mappings")
    expect(BROWSE_TYPES.concordances.listComponent).toBe("concordances")
    expect(BROWSE_TYPES.annotations.listComponent).toBe("annotations")
  })

  it("selects the detail renderer via the detailComponent key", () => {
    expect(BROWSE_TYPES.schemes.detailComponent).toBe("item")
    expect(BROWSE_TYPES.concepts.detailComponent).toBe("item")
    expect(BROWSE_TYPES.mappings.detailComponent).toBe("mapping")
    expect(BROWSE_TYPES.concordances.detailComponent).toBe("concordance")
    expect(BROWSE_TYPES.annotations.detailComponent).toBe("annotation")
  })

  it("deep-links URI-resolvable items and keeps other records in memory", () => {
    expect(BROWSE_TYPES.schemes.selection).toBe("url")
    expect(BROWSE_TYPES.concepts.selection).toBe("url")
    expect(BROWSE_TYPES.mappings.selection).toBe("memory")
    expect(BROWSE_TYPES.concordances.selection).toBe("memory")
    expect(BROWSE_TYPES.annotations.selection).toBe("memory")
  })

  it("returns null for an unknown type", () => {
    expect(getBrowseType("nope")).toBeNull()
    expect(getBrowseType("schemes")).toBe(BROWSE_TYPES.schemes)
  })
})
