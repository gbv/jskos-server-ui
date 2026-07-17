import { mount } from "@vue/test-utils"
import ConcordanceDetail from "@/components/browse/ConcordanceDetail.vue"

const ItemNameStub = {
  props: ["item"],
  template: "<span class='stub-itemname'>{{ item.uri }}</span>",
}

function makeConcordance(overrides = {}) {
  return {
    fromScheme: { uri: "urn:scheme:from", notation: ["A"] },
    toScheme: { uri: "urn:scheme:to", notation: ["B"] },
    ...overrides,
  }
}

function mountDetail(concordance, props = {}) {
  return mount(ConcordanceDetail, {
    props: { concordance, language: "en", ...props },
    global: { stubs: { ItemName: ItemNameStub } },
  })
}

describe("ConcordanceDetail", () => {
  it("renders the source and target schemes", () => {
    const wrapper = mountDetail(makeConcordance())
    const from = wrapper.find(".jskos-vue-concordanceDetail-from")
    const to = wrapper.find(".jskos-vue-concordanceDetail-to")
    expect(from.find(".stub-itemname").text()).toBe("urn:scheme:from")
    expect(to.find(".stub-itemname").text()).toBe("urn:scheme:to")
  })

  it("shows the description from scopeNote", () => {
    const wrapper = mountDetail(
      makeConcordance({
        scopeNote: { en: ["A concordance between A and B."] },
      }),
    )
    expect(wrapper.text()).toContain("Description")
    expect(wrapper.text()).toContain("A concordance between A and B.")
  })

  it("shows the extent as the mapping count", () => {
    const wrapper = mountDetail(makeConcordance({ extent: "1234" }))
    expect(wrapper.text()).toContain("Mappings")
    expect(wrapper.text()).toContain("1234")
  })

  it("renders publisher, creator and contributor with links", () => {
    const wrapper = mountDetail(
      makeConcordance({
        publisher: [
          { uri: "https://example.org/pub", prefLabel: { en: "Pub" } },
        ],
        creator: [{ prefLabel: { en: "Alice" } }],
        contributor: [
          { url: "https://example.org/bob", prefLabel: { en: "Bob" } },
        ],
      }),
    )
    expect(wrapper.text()).toContain("Publisher")
    expect(wrapper.find("a[href='https://example.org/pub']").text()).toBe("Pub")
    expect(wrapper.text()).toContain("Creator")
    expect(wrapper.text()).toContain("Alice")
    expect(wrapper.text()).toContain("Contributor")
    expect(wrapper.find("a[href='https://example.org/bob']").text()).toBe("Bob")
  })

  it("lists distributions as download links with a format label", () => {
    const wrapper = mountDetail(
      makeConcordance({
        distributions: [
          { download: "https://example.org/c.ndjson", format: "NDJSON" },
        ],
      }),
    )
    expect(wrapper.text()).toContain("Download")
    expect(wrapper.find("a[href='https://example.org/c.ndjson']").text()).toBe(
      "NDJSON",
    )
  })

  it("lists the URI and identifiers", () => {
    const wrapper = mountDetail(
      makeConcordance({
        uri: "https://example.org/concordance/1",
        identifier: ["urn:hash-1"],
      }),
    )
    expect(wrapper.text()).toContain("Identifier")
    expect(
      wrapper.find("a[href='https://example.org/concordance/1']").exists(),
    ).toBe(true)
    expect(wrapper.text()).toContain("urn:hash-1")
  })

  it("renders a placeholder for a missing scheme", () => {
    const wrapper = mountDetail(makeConcordance({ toScheme: undefined }))
    const to = wrapper.find(".jskos-vue-concordanceDetail-to")
    expect(to.find(".jskos-vue-concordanceDetail-empty").exists()).toBe(true)
  })

  it("renders nothing when no concordance is given", () => {
    const wrapper = mountDetail(null)
    expect(wrapper.find(".jskos-vue-concordanceDetail").exists()).toBe(false)
  })
})
