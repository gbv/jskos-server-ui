import { mount } from "@vue/test-utils"
import ImportSourceSummary from "@/components/import/ImportSourceSummary.vue"

function makeSource(overrides = {}) {
  return {
    kind: "file",
    name: "vocabulary.ndjson",
    size: 1024,
    format: "ndjson",
    detectedType: "schemes",
    status: "pending",
    error: null,
    errorKind: null,
    result: null,
    ...overrides,
  }
}

function mountSummary(source = makeSource()) {
  return mount(ImportSourceSummary, { props: { source } })
}

describe("ImportSourceSummary", () => {
  it("names the source and shows its metrics", () => {
    const text = mountSummary().text()
    expect(text).toMatch(/vocabulary\.ndjson/)
    expect(text).toMatch(/NDJSON/)
    expect(text).toMatch(/1 KiB/)
  })

  it("shows a URL source without a size", () => {
    const text = mountSummary(
      makeSource({
        kind: "url",
        name: "https://example.org/api/voc",
        size: null,
        format: null,
        detectedType: null,
      }),
    ).text()
    expect(text).toMatch(/https:\/\/example\.org\/api\/voc/)
    expect(text).toMatch(/AUTO/)
    expect(text).toMatch(/—/)
  })

  it("shows the detected content type as a badge", () => {
    const badge = mountSummary().findComponent({ name: "BBadge" })
    expect(badge.text()).toBe("Terminologies")
    expect(badge.props("variant")).toBe("warning")
  })

  it("omits the badge when no type was detected", () => {
    const wrapper = mountSummary(makeSource({ detectedType: null }))
    expect(wrapper.findComponent({ name: "BBadge" }).exists()).toBe(false)
  })

  it("says nothing about the state of the import", () => {
    const text = mountSummary(
      makeSource({
        status: "done",
        result: { type: "schemes", count: 12, records: [] },
      }),
    ).text()
    expect(text).not.toMatch(/Imported/)
    expect(text).not.toMatch(/Importing/)
  })

  it("leaves failures to the notification", () => {
    const text = mountSummary(
      makeSource({ status: "failed", error: "The server rejected the data." }),
    ).text()
    expect(text).not.toMatch(/The server rejected the data\./)
  })
})
