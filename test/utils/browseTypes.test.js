import { BROWSE_TYPES, getBrowseType } from "@/utils/browseTypes"

describe("browseTypes", () => {
  it("exposes the browsable types with a matching capability key", () => {
    const keys = Object.keys(BROWSE_TYPES)
    expect(keys).toEqual(["schemes", "concepts", "mappings"])
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

  it("selects the flat list renderer via the listComponent key", () => {
    expect(BROWSE_TYPES.schemes.listComponent).toBe("items")
    expect(BROWSE_TYPES.concepts.listComponent).toBe("items")
    expect(BROWSE_TYPES.mappings.listComponent).toBe("mappings")
  })

  it("selects the detail renderer via the detailComponent key", () => {
    expect(BROWSE_TYPES.schemes.detailComponent).toBe("item")
    expect(BROWSE_TYPES.concepts.detailComponent).toBe("item")
    expect(BROWSE_TYPES.mappings.detailComponent).toBe("mapping")
  })

  it("deep-links URI-resolvable items and keeps other records in memory", () => {
    expect(BROWSE_TYPES.schemes.selection).toBe("url")
    expect(BROWSE_TYPES.concepts.selection).toBe("url")
    expect(BROWSE_TYPES.mappings.selection).toBe("memory")
  })

  it("returns null for an unknown type", () => {
    expect(getBrowseType("nope")).toBeNull()
    expect(getBrowseType("schemes")).toBe(BROWSE_TYPES.schemes)
  })
})
