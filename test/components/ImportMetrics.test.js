import { mount } from "@vue/test-utils"
import ImportMetrics from "@/components/import/ImportMetrics.vue"

describe("ImportMetrics", () => {
  it("pairs every label with its value", () => {
    const wrapper = mount(ImportMetrics, {
      props: {
        metrics: [
          { label: "Format", value: "NDJSON" },
          { label: "Size", value: "1 KiB" },
        ],
      },
    })

    expect(
      wrapper.findAll(".import-metric-label").map((node) => node.text()),
    ).toEqual(["Format", "Size"])
    expect(
      wrapper.findAll(".import-metric-value").map((node) => node.text()),
    ).toEqual(["NDJSON", "1 KiB"])
  })

  it("renders nothing for an empty list", () => {
    const wrapper = mount(ImportMetrics, { props: { metrics: [] } })

    expect(wrapper.findAll(".import-metric")).toHaveLength(0)
  })
})
