import { mount } from "@vue/test-utils"
import MappingList from "@/components/browse/MappingList.vue"

const ItemNameStub = {
  props: ["item"],
  template: "<span class='stub-itemname'>{{ item.uri }}</span>",
}

function makeMapping({
  from = [],
  to = [],
  type,
  uri,
  fromScheme,
  toScheme,
} = {}) {
  return {
    uri,
    type,
    from: { memberSet: from },
    to: { memberSet: to },
    fromScheme,
    toScheme,
  }
}

const exactMatch = ["http://www.w3.org/2004/02/skos/core#exactMatch"]

function mountList(mappings, props = {}) {
  return mount(MappingList, {
    props: { mappings, ...props },
    global: { stubs: { ItemName: ItemNameStub } },
  })
}

describe("MappingList", () => {
  it("renders one row per mapping with source and target concepts", () => {
    const wrapper = mountList([
      makeMapping({
        from: [{ uri: "urn:from-1" }],
        to: [{ uri: "urn:to-1" }],
        type: exactMatch,
      }),
      makeMapping({
        from: [{ uri: "urn:from-2" }],
        to: [{ uri: "urn:to-2a" }, { uri: "urn:to-2b" }],
        type: exactMatch,
      }),
    ])

    const rows = wrapper.findAll(".jskos-vue-mappingList-row")
    expect(rows).toHaveLength(2)

    const secondTo = rows[1].find(".jskos-vue-mappingList-to")
    expect(secondTo.findAll(".stub-itemname")).toHaveLength(2)
  })

  it("renders scheme labels under each side, like the detail relation", () => {
    const wrapper = mountList([
      makeMapping({
        from: [{ uri: "urn:from-1" }],
        to: [{ uri: "urn:to-1" }],
        type: exactMatch,
        fromScheme: { uri: "urn:scheme-a", notation: ["A"] },
        toScheme: { uri: "urn:scheme-b", notation: ["B"] },
      }),
    ])
    const schemes = wrapper.findAll(".jskos-vue-mappingList-scheme")
    expect(schemes.map((s) => s.text())).toEqual(["A", "B"])
  })

  it("omits scheme labels when the mapping has no schemes", () => {
    const wrapper = mountList([
      makeMapping({ from: [{ uri: "urn:a" }], to: [{ uri: "urn:b" }] }),
    ])
    expect(wrapper.find(".jskos-vue-mappingList-scheme").exists()).toBe(false)
  })

  it("shows the type notation badge as the connector and no fallback arrow", () => {
    const wrapper = mountList([
      makeMapping({
        from: [{ uri: "urn:a" }],
        to: [{ uri: "urn:b" }],
        type: exactMatch,
      }),
    ])
    expect(wrapper.find(".jskos-vue-mappingList-type").text()).toBe("=")
    expect(wrapper.find(".jskos-vue-arrow").exists()).toBe(false)
  })

  it("exposes the type label as an aria-label on the notation badge", () => {
    const wrapper = mountList(
      [
        makeMapping({
          from: [{ uri: "urn:a" }],
          to: [{ uri: "urn:b" }],
          type: exactMatch,
        }),
      ],
      { language: "en" },
    )
    expect(
      wrapper.find(".jskos-vue-mappingList-type").attributes("aria-label"),
    ).toBe("exact match")
  })

  it("builds a Cocoda-style tooltip from the type label and definition", () => {
    mountList(
      [
        makeMapping({
          from: [{ uri: "urn:a" }],
          to: [{ uri: "urn:b" }],
          type: exactMatch,
        }),
      ],
      { language: "en" },
    )
    const tooltipTexts = [
      ...document.body.querySelectorAll(".tooltip-inner"),
    ].map((element) => element.textContent)
    expect(tooltipTexts).toContain("exact match: same meaning")
  })

  it("falls back to the arrow connector when showType is false", () => {
    const wrapper = mountList(
      [
        makeMapping({
          from: [{ uri: "urn:a" }],
          to: [{ uri: "urn:b" }],
          type: exactMatch,
        }),
      ],
      { showType: false },
    )
    expect(wrapper.find(".jskos-vue-mappingList-type").exists()).toBe(false)
    expect(wrapper.find(".jskos-vue-arrow").exists()).toBe(true)
  })

  it("shows the generic mapping relation badge when a mapping has no type", () => {
    const wrapper = mountList([
      makeMapping({ from: [{ uri: "urn:a" }], to: [{ uri: "urn:b" }] }),
    ])
    expect(wrapper.find(".jskos-vue-mappingList-type").text()).toBe("→")
    expect(wrapper.find(".jskos-vue-arrow").exists()).toBe(false)
  })

  it("renders a placeholder for an empty side", () => {
    const wrapper = mountList([
      makeMapping({ from: [{ uri: "urn:a" }], to: [] }),
    ])
    const to = wrapper.find(".jskos-vue-mappingList-to")
    expect(to.find(".jskos-vue-mappingList-empty").exists()).toBe(true)
  })

  it("emits select with the mapping when a row is clicked in rowMode", async () => {
    const mapping = makeMapping({
      from: [{ uri: "urn:a" }],
      to: [{ uri: "urn:b" }],
      uri: "urn:mapping-1",
    })
    const wrapper = mountList([mapping])

    await wrapper.find(".jskos-vue-mappingList-row").trigger("click")

    expect(wrapper.emitted("select")).toHaveLength(1)
    expect(wrapper.emitted("select")[0][0]).toEqual({ mapping })
  })

  it("does not emit select when rowMode is disabled", async () => {
    const wrapper = mountList(
      [makeMapping({ from: [{ uri: "urn:a" }], to: [{ uri: "urn:b" }] })],
      { rowMode: false },
    )
    await wrapper.find(".jskos-vue-mappingList-row").trigger("click")
    expect(wrapper.emitted("select")).toBeUndefined()
  })

  it("marks the selected mapping's row and only that row", () => {
    const mappings = [
      makeMapping({ from: [{ uri: "urn:a" }], to: [{ uri: "urn:b" }] }),
      makeMapping({ from: [{ uri: "urn:c" }], to: [{ uri: "urn:d" }] }),
    ]
    const wrapper = mountList(mappings, { selected: mappings[1] })

    const rows = wrapper.findAll(".jskos-vue-mappingList-row")
    expect(rows[0].classes()).not.toContain(
      "jskos-vue-mappingList-row-selected",
    )
    expect(rows[1].classes()).toContain("jskos-vue-mappingList-row-selected")
  })
})
