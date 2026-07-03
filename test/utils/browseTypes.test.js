import { BROWSE_TYPES, getBrowseType } from "@/utils/browseTypes"

describe("browseTypes", () => {
  it("exposes the item-based browsable types with a matching capability key", () => {
    const keys = Object.keys(BROWSE_TYPES)
    expect(keys).toEqual(["schemes", "concepts"])
    for (const key of keys) {
      expect(BROWSE_TYPES[key].capability).toBe(key)
    }
  })

  it("routes item types to the main registry", () => {
    expect(BROWSE_TYPES.schemes.registry).toBe("registry")
    expect(BROWSE_TYPES.concepts.registry).toBe("registry")
  })

  it("returns null for an unknown type", () => {
    expect(getBrowseType("nope")).toBeNull()
    expect(getBrowseType("schemes")).toBe(BROWSE_TYPES.schemes)
  })
})
