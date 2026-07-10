import { mount } from "@vue/test-utils"
import AnnotationList from "@/components/AnnotationList.vue"

function makeAnnotation(overrides = {}) {
  return {
    id: "urn:annotation:1",
    motivation: "assessing",
    bodyValue: "+1",
    creator: { id: "urn:user:1", name: "Alice" },
    ...overrides,
  }
}

function mountList(annotations, props = {}) {
  return mount(AnnotationList, {
    props: { annotations, ...props },
  })
}

describe("AnnotationList", () => {
  it("renders one row per annotation with motivation and body", () => {
    const wrapper = mountList([
      makeAnnotation(),
      makeAnnotation({ id: "urn:annotation:2", bodyValue: "-1" }),
    ])
    const rows = wrapper.findAll(".jskos-vue-annotationList-row")
    expect(rows).toHaveLength(2)

    const first = rows[0]
    expect(first.find(".jskos-vue-annotationList-motivation").text()).toBe(
      "assessing",
    )
    expect(first.find(".jskos-vue-annotationList-body").text()).toBe("+1")
  })

  it("does not render a creator column", () => {
    const wrapper = mountList([makeAnnotation()])
    expect(wrapper.find(".jskos-vue-annotationList-creator").exists()).toBe(
      false,
    )
  })

  it("omits the motivation and body when absent", () => {
    const wrapper = mountList([
      { id: "urn:annotation:1", creator: "urn:user:2" },
    ])
    expect(wrapper.find(".jskos-vue-annotationList-motivation").exists()).toBe(
      false,
    )
    expect(wrapper.find(".jskos-vue-annotationList-body").exists()).toBe(false)
  })

  it("emits select with the annotation when a row is clicked in rowMode", async () => {
    const annotation = makeAnnotation()
    const wrapper = mountList([annotation])

    await wrapper.find(".jskos-vue-annotationList-row").trigger("click")

    expect(wrapper.emitted("select")).toHaveLength(1)
    expect(wrapper.emitted("select")[0][0]).toEqual({ annotation })
  })

  it("does not emit select when rowMode is disabled", async () => {
    const wrapper = mountList([makeAnnotation()], { rowMode: false })
    await wrapper.find(".jskos-vue-annotationList-row").trigger("click")
    expect(wrapper.emitted("select")).toBeUndefined()
  })

  it("marks the selected annotation's row and only that row", () => {
    const annotations = [
      makeAnnotation(),
      makeAnnotation({ id: "urn:annotation:2" }),
    ]
    const wrapper = mountList(annotations, { selected: annotations[1] })

    const rows = wrapper.findAll(".jskos-vue-annotationList-row")
    expect(rows[0].classes()).not.toContain(
      "jskos-vue-annotationList-row-selected",
    )
    expect(rows[1].classes()).toContain("jskos-vue-annotationList-row-selected")
  })
})
