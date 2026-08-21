import { mount } from "@vue/test-utils"
import RecordDetailModal from "@/components/browse/RecordDetailModal.vue"

const BModalStub = {
  props: ["modelValue", "title"],
  template:
    "<div class='stub-modal'><div class='stub-title'>{{ title }}</div><slot /></div>",
}

const scheme = {
  uri: "urn:test:scheme",
  notation: ["DDC"],
  prefLabel: { en: "Dewey Decimal Classification" },
  type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
}

const mapping = {
  uri: "urn:test:mapping",
  from: {
    memberSet: [{ uri: "urn:test:concept:1", prefLabel: { en: "Cats" } }],
  },
  to: {
    memberSet: [{ uri: "urn:test:concept:2", prefLabel: { en: "Felines" } }],
  },
  type: ["http://www.w3.org/2004/02/skos/core#exactMatch"],
}

function mountModal(props = {}) {
  return mount(RecordDetailModal, {
    props: { modelValue: true, type: "schemes", record: scheme, ...props },
    global: {
      stubs: { BModal: BModalStub },
    },
  })
}

describe("RecordDetailModal", () => {
  it("renders the record through the detail component of its type", () => {
    const schemeWrapper = mountModal()
    const mappingWrapper = mountModal({ type: "mappings", record: mapping })

    expect(schemeWrapper.find(".browse-detail").exists()).toBe(true)
    expect(schemeWrapper.text()).toContain("Dewey Decimal Classification")
    expect(mappingWrapper.find(".jskos-vue-mappingDetail").exists()).toBe(true)
    expect(mappingWrapper.find(".browse-detail").exists()).toBe(false)
  })

  // Mappings and annotations carry no label of their own, where the URI would
  // make for a poor title.
  it("titles the modal with the record label, falling back to its type", () => {
    expect(mountModal().find(".stub-title").text()).toBe(
      "Dewey Decimal Classification",
    )
    expect(
      mountModal({ type: "mappings", record: mapping })
        .find(".stub-title")
        .text(),
    ).toBe("Mappings")
  })

  it("reports missing details without a record or detail component", () => {
    expect(mountModal({ record: null }).text()).toContain(
      "No details available",
    )
    expect(mountModal({ type: "occurrences" }).text()).toContain(
      "No details available",
    )
  })

  it("forwards a selection made inside the detail component", () => {
    const wrapper = mountModal()

    wrapper.findComponent({ name: "BrowseDetail" }).vm.$emit("select", {
      record: scheme,
    })

    expect(wrapper.emitted("select")).toEqual([[{ record: scheme }]])
  })
})
