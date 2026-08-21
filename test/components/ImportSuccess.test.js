import { mount } from "@vue/test-utils"
import { createTestingPinia } from "@pinia/testing"
import { createRouter, createMemoryHistory } from "vue-router"
import ImportSuccess from "@/components/import/ImportSuccess.vue"

const scheme = {
  uri: "urn:test:scheme",
  notation: ["ddc"],
  prefLabel: { en: "Dewey Decimal Classification" },
}

const concept = {
  uri: "urn:test:concept",
  prefLabel: { en: "A concept" },
  inScheme: [{ uri: "urn:test:scheme" }],
}

function mountSuccess(props = {}) {
  return mount(ImportSuccess, {
    props: {
      result: { type: "schemes", count: 1, records: [scheme] },
      sourceName: "ddc.json",
      ...props,
    },
    attachTo: document.body,
    global: {
      plugins: [
        createTestingPinia({
          initialState: { server: { activeUrl: "http://localhost:3000/" } },
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

/**
 * Returns the button carrying a given label.
 *
 * @param {!Object} wrapper The mounted component.
 * @param {!RegExp} label Pattern the button's text has to match.
 * @returns {Object} The button wrapper, or undefined when there is none.
 */
function findButton(wrapper, label) {
  return wrapper.findAll("a, button").find((node) => label.test(node.text()))
}

describe("ImportSuccess", () => {
  it("states what was written and where it came from", () => {
    const text = mountSuccess().text()

    expect(text).toMatch(/Import complete/)
    expect(text).toMatch(/ddc\.json/)
    expect(text).toMatch(/Terminologies/)
    expect(text).toMatch(/Dewey Decimal Classification/)
  })

  it("badges the object type next to the source", () => {
    const badges = mountSuccess()
      .findAll(".badge")
      .map((badge) => badge.text())

    expect(badges).toEqual(["Terminologies"])
  })

  it("marks an import that ran in bulk mode", () => {
    const badges = mountSuccess({ isBulk: true })
      .findAll(".badge")
      .map((badge) => badge.text())

    expect(badges).toEqual(["Bulk", "Terminologies"])
  })

  it("takes the focus to its heading", () => {
    const wrapper = mountSuccess()
    expect(document.activeElement).toBe(
      wrapper.find(".import-success-title").element,
    )
    wrapper.unmount()
  })

  it("asks to start over", async () => {
    const wrapper = mountSuccess()
    await wrapper.find(".import-success-restart").trigger("click")

    expect(wrapper.emitted("restart")).toHaveLength(1)
  })

  it("links to the browse view of the imported type", () => {
    const link = findButton(mountSuccess(), /Browse Terminologies/)

    expect(link.attributes("href")).toBe("/terminologies")
  })

  it("links several records to their browse view", () => {
    const link = findButton(
      mountSuccess({
        result: { type: "concepts", count: 2, records: [concept, scheme] },
      }),
      /Browse Concepts/,
    )

    expect(link.attributes("href")).toBe("/concepts")
  })

  it("offers no browse link for a type without a browse view", () => {
    const wrapper = mountSuccess({
      result: { type: "occurrences", count: 1, records: [scheme] },
    })

    expect(findButton(wrapper, /Browse/)).toBeUndefined()
    expect(wrapper.find(".import-success-restart").exists()).toBe(true)
  })
})
