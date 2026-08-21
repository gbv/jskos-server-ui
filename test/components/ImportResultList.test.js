import { mount } from "@vue/test-utils"
import { createTestingPinia } from "@pinia/testing"
import { createRouter, createMemoryHistory } from "vue-router"
import ImportResultList from "@/components/import/ImportResultList.vue"
import RecordDetailModal from "@/components/browse/RecordDetailModal.vue"

const scheme = {
  uri: "urn:test:scheme",
  notation: ["ddc"],
  prefLabel: { en: "Dewey Decimal Classification" },
  type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
}

function mountList(
  result,
  activeUrl = "http://localhost:3000/",
  isBulk = false,
) {
  return mount(ImportResultList, {
    props: {
      result: { type: "schemes", count: 1, records: [scheme], ...result },
      isBulk,
    },
    global: {
      plugins: [
        createTestingPinia({
          initialState: { server: { activeUrl } },
          stubActions: false,
        }),
        createRouter({
          history: createMemoryHistory(),
          routes: [
            { path: "/", component: { template: "<div/>" } },
            { path: "/terminologies", component: { template: "<div/>" } },
            { path: "/concepts", component: { template: "<div/>" } },
          ],
        }),
      ],
      stubs: { RecordDetailModal: true },
    },
  })
}

describe("ImportResultList", () => {
  it("names each imported record", () => {
    expect(mountList().text()).toMatch(/DDC\s+Dewey Decimal Classification/)
  })

  it("leaves the name unlinked and names each action", () => {
    const wrapper = mountList()

    expect(wrapper.find(".import-result-name").element.tagName).toBe("SPAN")
    expect(
      wrapper.findAll(".import-result-action").map((a) => a.text()),
    ).toEqual(["Details", "Browse", "JSON"])
  })

  it("shows a record in the detail modal instead of leaving the view", async () => {
    const wrapper = mountList()
    const modal = wrapper.findComponent(RecordDetailModal)

    expect(modal.props("modelValue")).toBe(false)

    await wrapper.findAll(".import-result-action")[0].trigger("click")

    expect(modal.props("modelValue")).toBe(true)
    expect(modal.props("type")).toBe("schemes")
    expect(modal.props("record")).toEqual(scheme)
  })

  it("opens the modal on the record whose action was used", async () => {
    const other = { uri: "urn:test:other", prefLabel: { en: "Another" } }
    const wrapper = mountList({ count: 2, records: [scheme, other] })

    await wrapper
      .findAll(".import-result-entry")[1]
      .find(".import-result-action")
      .trigger("click")

    expect(wrapper.findComponent(RecordDetailModal).props("record")).toEqual(
      other,
    )
  })

  it("offers the stored JSKOS data of every record in a new tab", () => {
    const actions = mountList({
      type: "mappings",
      records: [{ uri: "urn:test:mapping", prefLabel: { en: "A mapping" } }],
    }).findAll(".import-result-action")

    expect(actions.map((action) => action.text())).toEqual(["Details", "JSON"])
    expect(actions[1].attributes("href")).toBe(
      "http://localhost:3000/data?uri=urn%3Atest%3Amapping",
    )
    expect(actions[1].attributes("target")).toBe("_blank")
    expect(actions[1].attributes("rel")).toBe("noopener")
  })

  it("falls back to the URI where the server named no record", () => {
    const wrapper = mountList({
      count: 2,
      records: [{ uri: "urn:a" }, { uri: "urn:b" }],
    })

    expect(
      wrapper.findAll(".import-result-uri").map((uri) => uri.text()),
    ).toEqual(["urn:a", "urn:b"])
    expect(
      wrapper
        .findAll(".import-result-entry")[0]
        .findAll("a")[1]
        .attributes("href"),
    ).toBe("http://localhost:3000/data?uri=urn%3Aa")
  })

  // A bulk import reports URIs only, so the modal would have nothing to show.
  it("drops the detail action in bulk mode and explains the result", () => {
    const wrapper = mountList(
      { count: 2, records: [{ uri: "urn:a" }, { uri: "urn:b" }] },
      "http://localhost:3000/",
      true,
    )

    expect(
      wrapper.findAll(".import-result-action").map((a) => a.text()),
    ).toEqual(["Browse", "JSON", "Browse", "JSON"])
    expect(wrapper.findComponent(RecordDetailModal).exists()).toBe(false)
    expect(wrapper.find(".import-result-note").text()).toMatch(
      /URIs of stored records only.*skips invalid entries/,
    )
  })

  it("omits that note outside bulk mode", () => {
    expect(mountList().find(".import-result-note").exists()).toBe(false)
  })

  it("counts the imported records in its heading", () => {
    expect(
      mountList({ count: 12345 }).find(".import-result-title").text(),
    ).toBe("Records (12,345)")
  })

  it("counts the records beyond the listed ones", () => {
    const wrapper = mountList({
      count: 2481,
      records: [scheme, { uri: "urn:b", prefLabel: { en: "Another" } }],
    })

    expect(wrapper.findAll(".import-result-entry")).toHaveLength(2)
    expect(wrapper.find(".import-result-more").text()).toBe("and 2,479 more")
  })

  it("omits that note when every record is listed", () => {
    expect(mountList().find(".import-result-more").exists()).toBe(false)
  })

  it("omits the data link without a connected server", () => {
    expect(
      mountList({}, null)
        .findAll(".import-result-action")
        .map((action) => action.text()),
    ).toEqual(["Details", "Browse"])
  })

  it("links each record to its own place in the browse view", () => {
    const wrapper = mountList({
      count: 2,
      records: [scheme, { uri: "urn:test:other" }],
    })

    expect(
      wrapper
        .findAll(".import-result-entry")
        .map((entry) => entry.findAll("a")[0].attributes("href")),
    ).toEqual([
      "/terminologies?uri=urn:test:scheme",
      "/terminologies?uri=urn:test:other",
    ])
  })

  it("omits the browse link where the browse view cannot address the record", () => {
    const actions = mountList({
      type: "mappings",
      records: [{ uri: "urn:test:mapping" }],
    }).findAll(".import-result-action")

    expect(actions.map((action) => action.text())).toEqual(["Details", "JSON"])
  })
})
