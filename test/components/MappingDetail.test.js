import { mount } from "@vue/test-utils"
import MappingDetail from "@/components/browse/MappingDetail.vue"

const ItemNameStub = {
  props: ["item"],
  template: "<span class='stub-itemname'>{{ item.uri }}</span>",
}

function makeMapping(overrides = {}) {
  return {
    type: ["http://www.w3.org/2004/02/skos/core#exactMatch"],
    from: { memberSet: [{ uri: "urn:from-1" }] },
    to: { memberSet: [{ uri: "urn:to-1" }] },
    ...overrides,
  }
}

function mountDetail(mapping, props = {}) {
  return mount(MappingDetail, {
    props: { mapping, language: "en", ...props },
    global: { stubs: { ItemName: ItemNameStub } },
  })
}

describe("MappingDetail", () => {
  it("renders the source and target concepts", () => {
    const wrapper = mountDetail(makeMapping())
    const from = wrapper.find(".jskos-vue-mappingDetail-from")
    const to = wrapper.find(".jskos-vue-mappingDetail-to")
    expect(from.find(".stub-itemname").text()).toBe("urn:from-1")
    expect(to.find(".stub-itemname").text()).toBe("urn:to-1")
  })

  it("shows the mapping type badge with notation, label and definition", () => {
    const wrapper = mountDetail(makeMapping())
    expect(wrapper.find(".jskos-vue-mappingDetail-type").text()).toBe("=")
    expect(
      wrapper.find(".jskos-vue-mappingDetail-type").attributes("aria-label"),
    ).toBe("exact match")
    expect(wrapper.text()).toContain("exact match")
    expect(wrapper.text()).toContain("same meaning")
  })

  it("shows the mapping type label below the badge (e.g. close match)", () => {
    const closeMatch = ["http://www.w3.org/2004/02/skos/core#closeMatch"]
    const wrapper = mountDetail(makeMapping({ type: closeMatch }))
    const label = wrapper.find(".jskos-vue-mappingDetail-type-label")
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe("close match")
  })

  it("renders scheme labels for both sides", () => {
    const wrapper = mountDetail(
      makeMapping({
        fromScheme: { uri: "urn:scheme-a", notation: ["A"] },
        toScheme: { uri: "urn:scheme-b", notation: ["B"] },
      }),
    )
    const schemes = wrapper.findAll(".jskos-vue-mappingDetail-scheme")
    expect(schemes.map((s) => s.text())).toEqual(["A", "B"])
  })

  it("shows relevance only when present", () => {
    expect(mountDetail(makeMapping()).text()).not.toContain("Relevance")
    const wrapper = mountDetail(makeMapping({ mappingRelevance: 0.8 }))
    expect(wrapper.text()).toContain("Relevance")
    expect(wrapper.text()).toContain("0.8")
  })

  it("renders normalized creators as links", () => {
    const wrapper = mountDetail(
      makeMapping({
        creator: [{ uri: "urn:user-1", prefLabel: { en: "Alice" } }],
      }),
    )
    expect(wrapper.text()).toContain("Creator")
    const link = wrapper.find("a[href='urn:user-1']")
    expect(link.exists()).toBe(false)
    expect(wrapper.text()).toContain("Alice")
  })

  it("lists the URI and identifiers", () => {
    const wrapper = mountDetail(
      makeMapping({
        uri: "https://example.org/mapping/1",
        identifier: ["urn:hash-1"],
      }),
    )
    expect(wrapper.text()).toContain("Identifier")
    expect(
      wrapper.find("a[href='https://example.org/mapping/1']").exists(),
    ).toBe(true)
    expect(wrapper.text()).toContain("urn:hash-1")
  })

  it("shows justification and part-of concordances when present", () => {
    const wrapper = mountDetail(
      makeMapping({
        justification: "https://example.org/why",
        partOf: [
          { uri: "https://example.org/concordance/1", notation: ["C1"] },
        ],
      }),
    )
    expect(wrapper.text()).toContain("Justification")
    expect(wrapper.text()).toContain("Part of")
    expect(wrapper.find("a[href='https://example.org/why']").exists()).toBe(
      true,
    )
    expect(wrapper.text()).toContain("C1")
  })

  it("renders nothing when no mapping is given", () => {
    const wrapper = mountDetail(null)
    expect(wrapper.find(".jskos-vue-mappingDetail").exists()).toBe(false)
  })
})
