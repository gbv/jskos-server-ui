import { mount } from "@vue/test-utils"
import { createBootstrap } from "bootstrap-vue-next"
import ImportDropzone from "@/components/import/ImportDropzone.vue"

function mountDropzone(props = {}) {
  return mount(ImportDropzone, {
    props,
    global: { plugins: [createBootstrap()] },
  })
}

describe("ImportDropzone", () => {
  it("offers the accepted file types on the file input", () => {
    const wrapper = mountDropzone()
    expect(wrapper.find("input[type=file]").attributes("accept")).toBe(
      ".json,.ndjson,.tsv",
    )
  })

  it("takes only one file", () => {
    const wrapper = mountDropzone()
    expect(
      wrapper.find("input[type=file]").attributes("multiple"),
    ).toBeUndefined()
  })

  it("renders the drop hint", () => {
    expect(mountDropzone().text()).toMatch(/Drop a file here or/)
  })

  it("offers a button to select a file", () => {
    expect(mountDropzone().find("button").text()).toMatch(/Select File/)
  })

  it("names the accepted extensions", () => {
    expect(mountDropzone().text()).toMatch(/\.json, \.ndjson, or \.tsv/)
  })

  it("describes the select button with the accepted extensions", () => {
    const wrapper = mountDropzone()
    const describedBy = wrapper.find("button").attributes("aria-describedby")

    expect(wrapper.find(`#${describedBy}`).text()).toBe(
      ".json, .ndjson, or .tsv",
    )
  })

  it("disables the select button while an import is running", () => {
    const wrapper = mountDropzone({ disabled: true })
    expect(wrapper.find("button").attributes("disabled")).toBeDefined()
  })

  it("renders the drop zone wrapper", () => {
    expect(mountDropzone().find(".b-form-file-wrapper").exists()).toBe(true)
  })

  it("emits the selected file and resets so the next drop is picked up", async () => {
    const wrapper = mountDropzone()
    const file = new File(["{}"], "a.json")

    wrapper
      .findComponent({ name: "BFormFile" })
      .vm.$emit("update:modelValue", file)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted("add")).toEqual([[file]])
  })

  it("does not emit when the selection is cleared", async () => {
    const wrapper = mountDropzone()

    wrapper
      .findComponent({ name: "BFormFile" })
      .vm.$emit("update:modelValue", null)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted("add")).toBeUndefined()
  })

  it("reports a dropped file it cannot import", async () => {
    const wrapper = mountDropzone()

    await wrapper.trigger("drop", {
      dataTransfer: { files: [new File(["x"], "data.csv")] },
    })

    expect(wrapper.emitted("reject")).toEqual([["data.csv"]])
  })

  it("reports a drop of more than one file", async () => {
    const wrapper = mountDropzone()

    await wrapper.trigger("drop", {
      dataTransfer: {
        files: [new File(["{}"], "a.ndjson"), new File(["{}"], "b.ndjson")],
      },
    })

    expect(wrapper.emitted("reject-multiple")).toHaveLength(1)
    expect(wrapper.emitted("reject")).toBeUndefined()
  })

  it("stays quiet when the dropped file is supported", async () => {
    const wrapper = mountDropzone()

    await wrapper.trigger("drop", {
      dataTransfer: { files: [new File(["{}"], "good.json")] },
    })

    expect(wrapper.emitted("reject")).toBeUndefined()
  })

  it("accepts a dropped SSSOM/TSV file", async () => {
    const wrapper = mountDropzone()

    await wrapper.trigger("drop", {
      dataTransfer: { files: [new File(["a\tb"], "mappings.sssom.tsv")] },
    })

    expect(wrapper.emitted("reject")).toBeUndefined()
  })

  it("ignores drops while an import is running", async () => {
    const wrapper = mountDropzone({ disabled: true })

    await wrapper.trigger("drop", {
      dataTransfer: { files: [new File(["x"], "data.csv")] },
    })

    expect(wrapper.emitted("reject")).toBeUndefined()
  })

  it("disables the input while an import is running", () => {
    const wrapper = mountDropzone({ disabled: true })
    expect(
      wrapper.find("input[type=file]").attributes("disabled"),
    ).toBeDefined()
  })
})
