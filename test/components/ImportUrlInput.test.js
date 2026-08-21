import { mount } from "@vue/test-utils"
import { createBootstrap } from "bootstrap-vue-next"
import ImportUrlInput from "@/components/import/ImportUrlInput.vue"

function mountInput(props = {}) {
  return mount(ImportUrlInput, {
    props,
    global: { plugins: [createBootstrap()] },
  })
}

async function enter(wrapper, value) {
  const input = wrapper.find("input")
  await input.setValue(value)
  return input
}

describe("ImportUrlInput", () => {
  it("labels the field for assistive technology", () => {
    expect(mountInput().find("input").attributes("aria-label")).toMatch(/URL/i)
  })

  it("keeps the add button disabled until a URL is entered", async () => {
    const wrapper = mountInput()
    expect(wrapper.find("button").attributes("disabled")).toBeDefined()

    await enter(wrapper, "https://example.org/voc.ndjson")
    expect(wrapper.find("button").attributes("disabled")).toBeUndefined()
  })

  it("rejects input that is not an http(s) URL", async () => {
    const wrapper = mountInput()
    await enter(wrapper, "not a url")
    expect(wrapper.find("button").attributes("disabled")).toBeDefined()
  })

  it("emits the trimmed URL and clears the field", async () => {
    const wrapper = mountInput()
    const input = await enter(wrapper, "  https://example.org/voc.ndjson  ")
    await wrapper.find("button").trigger("click")

    expect(wrapper.emitted("add")).toEqual([["https://example.org/voc.ndjson"]])
    expect(input.element.value).toBe("")
  })

  it("adds on Enter", async () => {
    const wrapper = mountInput()
    const input = await enter(wrapper, "https://example.org/voc.json")
    await input.trigger("keyup.enter")

    expect(wrapper.emitted("add")).toEqual([["https://example.org/voc.json"]])
  })

  it("does not emit while disabled", async () => {
    const wrapper = mountInput({ disabled: true })
    await enter(wrapper, "https://example.org/voc.json")
    await wrapper.find("button").trigger("click")

    expect(wrapper.emitted("add")).toBeUndefined()
  })
})
