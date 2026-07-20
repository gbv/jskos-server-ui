import { mount, flushPromises } from "@vue/test-utils"
import { createTestingPinia } from "@pinia/testing"
import DetailActionBar from "@/components/browse/DetailActionBar.vue"

const notify = vi.hoisted(() => vi.fn())

vi.mock("@/composables/useNotify", () => ({
  useNotify: () => ({ notify }),
}))

const auth = vi.hoisted(() => ({}))

vi.mock("@/composables/useAuth", async () => {
  const { ref } = await import("vue")
  auth.user = ref(null)
  auth.token = ref(null)
  auth.loginPublicKey = ref(null)
  auth.loggedIn = ref(false)
  return { useAuth: () => auth }
})

const ConfirmModalStub = {
  props: ["modelValue", "title", "confirmLabel"],
  emits: ["confirm", "update:modelValue"],
  template:
    "<div v-if='modelValue' class='stub-confirm'>" +
    "<slot />" +
    "<button class='stub-confirm-ok' @click=\"$emit('confirm')\">ok</button>" +
    "</div>",
}

const mappingFixture = { uri: "urn:mapping:1" }

const openDelete = { supported: true, requiresAuth: false }
const authDelete = { supported: true, requiresAuth: true }

const wrappers = []

function mountBar(storeState = {}, props = {}) {
  const wrapper = mount(DetailActionBar, {
    props: { type: "mappings", record: mappingFixture, ...props },
    global: {
      plugins: [
        createTestingPinia({
          initialState: { server: storeState },
          stubActions: false,
        }),
      ],
      stubs: { ConfirmModal: ConfirmModalStub },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

function tooltipTexts() {
  return [...document.body.querySelectorAll(".tooltip-inner")].map(
    (element) => element.textContent,
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  auth.user.value = null
  auth.token.value = null
  auth.loginPublicKey.value = null
  auth.loggedIn.value = false
})

afterEach(() => {
  while (wrappers.length) {
    wrappers.pop().unmount()
  }
})

describe("DetailActionBar", () => {
  it("renders nothing for a type without configured actions", () => {
    const wrapper = mountBar(
      { capabilities: { schemes: { delete: openDelete } } },
      { type: "schemes", record: { uri: "urn:scheme:1" } },
    )

    expect(wrapper.find(".detail-action-bar").exists()).toBe(false)
  })

  it("renders nothing when the server does not offer delete for the type", () => {
    const wrapper = mountBar({
      capabilities: { mappings: { read: openDelete } },
    })

    expect(wrapper.find(".detail-action-bar").exists()).toBe(false)
  })

  it("disables the button with a sign-in tooltip when delete requires auth", () => {
    const wrapper = mountBar({
      capabilities: { mappings: { delete: authDelete } },
      mappingsRegistry: { isAuthorizedFor: vi.fn(() => false) },
    })

    expect(wrapper.find("button").attributes("disabled")).toBeDefined()
    expect(tooltipTexts()).toContain("Sign in to delete")
  })

  it("disables the button with a tooltip when the user is not authorized", () => {
    auth.loggedIn.value = true
    const wrapper = mountBar({
      capabilities: { mappings: { delete: authDelete } },
      mappingsRegistry: { isAuthorizedFor: vi.fn(() => false) },
    })

    expect(wrapper.find("button").attributes("disabled")).toBeDefined()
    expect(tooltipTexts()).toContain("Not authorized to delete this entry")
  })

  it("shows no tooltip when deletion is allowed", () => {
    mountBar({
      capabilities: { mappings: { delete: openDelete } },
      mappingsRegistry: {},
    })

    expect(tooltipTexts().join("")).toBe("")
  })

  it("deletes the mapping after confirmation and reports success", async () => {
    const deleteMapping = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountBar({
      capabilities: { mappings: { delete: openDelete } },
      mappingsRegistry: { deleteMapping },
    })

    const button = wrapper.find("button")
    expect(button.attributes("disabled")).toBeUndefined()
    expect(wrapper.find(".stub-confirm").exists()).toBe(false)

    await button.trigger("click")
    expect(wrapper.find(".stub-confirm").exists()).toBe(true)

    await wrapper.find(".stub-confirm-ok").trigger("click")
    await flushPromises()

    expect(deleteMapping).toHaveBeenCalledWith({ mapping: mappingFixture })
    expect(wrapper.emitted("deleted")?.at(-1)).toEqual([
      { record: mappingFixture },
    ])
    expect(notify).toHaveBeenCalledWith("Entry deleted.", "success")
  })

  it("reports a failed deletion and does not emit deleted", async () => {
    const deleteMapping = vi.fn().mockRejectedValue(new Error("Nope"))
    const wrapper = mountBar({
      capabilities: { mappings: { delete: openDelete } },
      mappingsRegistry: { deleteMapping },
    })

    await wrapper.find("button").trigger("click")
    await wrapper.find(".stub-confirm-ok").trigger("click")
    await flushPromises()

    expect(notify).toHaveBeenCalledWith("Could not delete: Nope", "danger")
    expect(wrapper.emitted("deleted")).toBeUndefined()
  })

  it("reports a friendly message when the server rejects with 403", async () => {
    const error = new Error("Request failed with status code 403")
    error.relatedError = { response: { status: 403 } }
    const deleteMapping = vi.fn().mockRejectedValue(error)
    const wrapper = mountBar({
      capabilities: { mappings: { delete: openDelete } },
      mappingsRegistry: { deleteMapping },
    })

    await wrapper.find("button").trigger("click")
    await wrapper.find(".stub-confirm-ok").trigger("click")
    await flushPromises()

    expect(notify).toHaveBeenCalledWith(
      "You are not authorized to delete this entry.",
      "danger",
    )
    expect(wrapper.emitted("deleted")).toBeUndefined()
  })

  it("deletes a concordance via deleteConcordance", async () => {
    const concordance = { uri: "urn:concordance:1" }
    const deleteConcordance = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountBar(
      {
        capabilities: { concordances: { delete: openDelete } },
        mappingsRegistry: { deleteConcordance },
      },
      { type: "concordances", record: concordance },
    )

    await wrapper.find("button").trigger("click")
    await wrapper.find(".stub-confirm-ok").trigger("click")
    await flushPromises()

    expect(deleteConcordance).toHaveBeenCalledWith({ concordance })
  })

  it("warns about a concordance that still has mappings", async () => {
    const concordance = { uri: "urn:concordance:1", extent: "5" }
    const wrapper = mountBar(
      {
        capabilities: { concordances: { delete: openDelete } },
        mappingsRegistry: {},
      },
      { type: "concordances", record: concordance },
    )

    await wrapper.find("button").trigger("click")

    expect(wrapper.find(".stub-confirm").text()).toContain(
      "still has 5 mappings",
    )
  })

  it("deletes an annotation via deleteAnnotation", async () => {
    const annotation = { id: "urn:annotation:1" }
    const deleteAnnotation = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountBar(
      {
        capabilities: { annotations: { delete: openDelete } },
        mappingsRegistry: { deleteAnnotation },
      },
      { type: "annotations", record: annotation },
    )

    await wrapper.find("button").trigger("click")
    await wrapper.find(".stub-confirm-ok").trigger("click")
    await flushPromises()

    expect(deleteAnnotation).toHaveBeenCalledWith({ annotation })
  })
})
