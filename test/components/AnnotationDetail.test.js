import { mount } from "@vue/test-utils"
import AnnotationDetail from "@/components/browse/AnnotationDetail.vue"

function makeAnnotation(overrides = {}) {
  return {
    id: "https://example.org/annotations/1",
    motivation: "assessing",
    bodyValue: "+1",
    target: "https://example.org/mappings/1",
    creator: { id: "https://example.org/users/1", name: "Alice" },
    created: "2020-01-02T03:04:05Z",
    ...overrides,
  }
}

function mountDetail(annotation, props = {}) {
  return mount(AnnotationDetail, {
    props: { annotation, language: "en", ...props },
  })
}

describe("AnnotationDetail", () => {
  it("shows the motivation and body in the header, mirroring the list row", () => {
    const wrapper = mountDetail(makeAnnotation())
    const header = wrapper.find(".jskos-vue-annotationDetail-header")
    expect(header.find(".jskos-vue-annotationDetail-motivation").text()).toBe(
      "assessing",
    )
    expect(header.find(".jskos-vue-annotationDetail-body").text()).toBe("+1")
  })

  it("renders the creator name and links its URI", () => {
    const wrapper = mountDetail(makeAnnotation())
    expect(wrapper.text()).toContain("Alice")
    expect(wrapper.find("a[href='https://example.org/users/1']").exists()).toBe(
      true,
    )
  })

  it("links the target, normalizing an id to a href", () => {
    const wrapper = mountDetail(
      makeAnnotation({
        target: [
          "https://example.org/mappings/1",
          { id: "https://example.org/mappings/2" },
        ],
      }),
    )
    expect(
      wrapper.find("a[href='https://example.org/mappings/1']").exists(),
    ).toBe(true)
    expect(
      wrapper.find("a[href='https://example.org/mappings/2']").exists(),
    ).toBe(true)
  })

  it("shows a plain creator name when there is no creator URI", () => {
    const wrapper = mountDetail(makeAnnotation({ creator: { name: "Bob" } }))
    expect(wrapper.text()).toContain("Bob")
    expect(wrapper.findAll("a").map((a) => a.text())).not.toContain("Bob")
  })

  it("renders nothing when no annotation is given", () => {
    const wrapper = mountDetail(null)
    expect(wrapper.find(".jskos-vue-annotationDetail").exists()).toBe(false)
  })
})
