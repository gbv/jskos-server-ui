import { formatCount, formatByteSize } from "@/utils/format"

describe("formatCount", () => {
  it("groups thousands", () => {
    expect(formatCount(1)).toBe("1")
    expect(formatCount(2481)).toBe("2,481")
    expect(formatCount(1000000)).toBe("1,000,000")
  })

  it("returns an empty string for unknown counts", () => {
    expect(formatCount(null)).toBe("")
    expect(formatCount(undefined)).toBe("")
    expect(formatCount(NaN)).toBe("")
  })
})

describe("formatByteSize", () => {
  it("formats sizes across units", () => {
    expect(formatByteSize(512)).toBe("512 B")
    expect(formatByteSize(2048)).toBe("2 KiB")
    expect(formatByteSize(1536)).toBe("1.5 KiB")
    expect(formatByteSize(5 * 1024 * 1024)).toBe("5 MiB")
    expect(formatByteSize(3 * 1024 ** 3)).toBe("3 GiB")
  })

  it("switches units at 1024, not at 1000", () => {
    expect(formatByteSize(1000)).toBe("1000 B")
    expect(formatByteSize(1024)).toBe("1 KiB")
  })

  it("returns an empty string for unknown sizes", () => {
    expect(formatByteSize(null)).toBe("")
    expect(formatByteSize(undefined)).toBe("")
  })
})
