import { annotationBodyText } from "@/utils/annotations"

describe("annotationBodyText", () => {
  it("returns the bodyValue as a string", () => {
    expect(annotationBodyText({ bodyValue: "+1" })).toBe("+1")
    expect(annotationBodyText({ bodyValue: 0 })).toBe("0")
  })

  it("reads value or id from a single body object", () => {
    expect(annotationBodyText({ body: { value: "note" } })).toBe("note")
    expect(annotationBodyText({ body: { id: "urn:tag:1" } })).toBe("urn:tag:1")
  })

  it("joins multiple bodies into a comma-separated string", () => {
    expect(
      annotationBodyText({ body: [{ value: "a" }, { id: "urn:b" }, "c"] }),
    ).toBe("a, urn:b, c")
  })

  it("returns an empty string when there is no body", () => {
    expect(annotationBodyText({})).toBe("")
    expect(annotationBodyText(null)).toBe("")
  })
})
