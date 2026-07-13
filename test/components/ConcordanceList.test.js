import { mount } from "@vue/test-utils"
import ConcordanceList from "@/components/browse/ConcordanceList.vue"

const ItemNameStub = {
  props: ["item"],
  template: "<span class='stub-itemname'>{{ item.uri }}</span>",
}

function makeConcordance({ fromScheme, toScheme, uri } = {}) {
  return { uri, fromScheme, toScheme }
}

function mountList(concordances, props = {}) {
  return mount(ConcordanceList, {
    props: { concordances, ...props },
    global: { stubs: { ItemName: ItemNameStub } },
  })
}

describe("ConcordanceList", () => {
  it("renders one row per concordance with source and target schemes", () => {
    const wrapper = mountList([
      makeConcordance({
        fromScheme: { uri: "urn:from-1" },
        toScheme: { uri: "urn:to-1" },
      }),
      makeConcordance({
        fromScheme: { uri: "urn:from-2" },
        toScheme: { uri: "urn:to-2" },
      }),
    ])

    const rows = wrapper.findAll(".jskos-vue-concordanceList-row")
    expect(rows).toHaveLength(2)

    const firstFrom = rows[0].find(".jskos-vue-concordanceList-from")
    const firstTo = rows[0].find(".jskos-vue-concordanceList-to")
    expect(firstFrom.find(".stub-itemname").text()).toBe("urn:from-1")
    expect(firstTo.find(".stub-itemname").text()).toBe("urn:to-1")
  })

  it("renders a placeholder for a missing scheme", () => {
    const wrapper = mountList([
      makeConcordance({ fromScheme: { uri: "urn:a" } }),
    ])
    const to = wrapper.find(".jskos-vue-concordanceList-to")
    expect(to.find(".jskos-vue-concordanceList-empty").exists()).toBe(true)
  })

  it("emits select with the concordance when a row is clicked in rowMode", async () => {
    const concordance = makeConcordance({
      fromScheme: { uri: "urn:a" },
      toScheme: { uri: "urn:b" },
      uri: "urn:concordance-1",
    })
    const wrapper = mountList([concordance])

    await wrapper.find(".jskos-vue-concordanceList-row").trigger("click")

    expect(wrapper.emitted("select")).toHaveLength(1)
    expect(wrapper.emitted("select")[0][0]).toEqual({ concordance })
  })

  it("does not emit select when rowMode is disabled", async () => {
    const wrapper = mountList(
      [
        makeConcordance({
          fromScheme: { uri: "urn:a" },
          toScheme: { uri: "urn:b" },
        }),
      ],
      { rowMode: false },
    )
    await wrapper.find(".jskos-vue-concordanceList-row").trigger("click")
    expect(wrapper.emitted("select")).toBeUndefined()
  })

  it("marks the selected concordance's row and only that row", () => {
    const concordances = [
      makeConcordance({
        fromScheme: { uri: "urn:a" },
        toScheme: { uri: "urn:b" },
      }),
      makeConcordance({
        fromScheme: { uri: "urn:c" },
        toScheme: { uri: "urn:d" },
      }),
    ]
    const wrapper = mountList(concordances, { selected: concordances[1] })

    const rows = wrapper.findAll(".jskos-vue-concordanceList-row")
    expect(rows[0].classes()).not.toContain(
      "jskos-vue-concordanceList-row-selected",
    )
    expect(rows[1].classes()).toContain(
      "jskos-vue-concordanceList-row-selected",
    )
  })
})
