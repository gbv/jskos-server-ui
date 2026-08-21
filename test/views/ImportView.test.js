import { mount } from "@vue/test-utils"
import { ref } from "vue"
import { createTestingPinia } from "@pinia/testing"
import { createRouter, createMemoryHistory } from "vue-router"
import ImportView from "@/views/ImportView.vue"
import { IMPORTABLE_TYPES } from "@/utils/import"

const notify = vi.hoisted(() => vi.fn())

vi.mock("@/composables/useNotify", () => ({
  useNotify: () => ({ notify }),
}))

const queue = vi.hoisted(() => ({}))

vi.mock("@/composables/useImport", () => ({
  useImport: () => queue,
}))

const auth = vi.hoisted(() => ({}))

vi.mock("@/composables/useAuth", async () => {
  const { ref } = await import("vue")
  auth.isLoginConnected = ref(true)
  auth.signIn = vi.fn()
  return { useAuth: () => auth }
})

/**
 * Resets the mocked import queue to a usable server with a single source.
 *
 * @param {Object} overrides Values replacing the defaults.
 */
function setQueue(overrides = {}) {
  Object.assign(queue, {
    source: ref({
      kind: "file",
      name: "voc.ndjson",
      size: 1024,
      format: "ndjson",
      detectedType: "schemes",
      status: "pending",
      error: null,
      errorKind: null,
      result: null,
    }),
    isBulk: ref(false),
    selectedType: ref("schemes"),
    canImport: ref(true),
    typeAccess: ref(
      Object.fromEntries(IMPORTABLE_TYPES.map((type) => [type, "open"])),
    ),
    unavailableReason: ref(null),
    blockedReason: ref(null),
    hasTypeMismatch: ref(false),
    isUploading: ref(false),
    result: ref(null),
    addFile: vi.fn(),
    addUrl: vi.fn(),
    reset: vi.fn(),
    reportRejectedFile: vi.fn(),
    reportMultipleFiles: vi.fn(),
    cancelImport: vi.fn(),
    startImport: vi.fn(),
    ...overrides,
  })
}

function mountView() {
  return mount(ImportView, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            server: { activeUrl: "http://localhost:3000/" },
          },
          stubActions: false,
        }),
        createRouter({
          history: createMemoryHistory(),
          routes: [
            { path: "/", component: { template: "<div/>" } },
            { path: "/connection", component: { template: "<div/>" } },
            { path: "/terminologies", component: { template: "<div/>" } },
          ],
        }),
      ],
    },
  })
}

beforeEach(() => {
  notify.mockClear()
  auth.signIn.mockClear()
  setQueue()
})

describe("ImportView", () => {
  it("offers every importable type and disables the blocked ones", () => {
    setQueue({
      typeAccess: ref({
        ...Object.fromEntries(
          IMPORTABLE_TYPES.map((type) => [type, "unsupported"]),
        ),
        schemes: "open",
      }),
    })
    const options = mountView().find("#import-type").findAll("option").slice(1)

    expect(options).toHaveLength(IMPORTABLE_TYPES.length)
    expect(options[0].attributes("disabled")).toBeUndefined()
    expect(options[1].attributes("disabled")).toBeDefined()
  })

  it("names in the option why a type cannot be picked", () => {
    setQueue({
      typeAccess: ref({
        ...Object.fromEntries(IMPORTABLE_TYPES.map((type) => [type, "denied"])),
        schemes: "open",
        concepts: "auth-required",
      }),
    })
    const texts = mountView()
      .findAll("#import-type option")
      .map((option) => option.text())

    expect(texts).toContain("Terminologies")
    expect(texts.some((text) => text.endsWith("(sign-in required)"))).toBe(true)
    expect(texts.some((text) => text.endsWith("(not authorized)"))).toBe(true)
  })

  it("explains a selected type the server will not take", () => {
    setQueue({
      blockedReason: ref(
        "This server does not accept imports of Concordances.",
      ),
    })
    const wrapper = mountView()

    expect(wrapper.find("#import-type-blocked").text()).toMatch(
      /does not accept imports of Concordances/,
    )
    expect(
      wrapper.find(".import-note-action").exists(),
      "nothing to sign in for",
    ).toBe(false)
  })

  it("offers the sign-in next to a type that only needs a login", async () => {
    setQueue({
      blockedReason: ref("Importing this content type requires a sign-in."),
      typeAccess: ref({
        ...Object.fromEntries(IMPORTABLE_TYPES.map((type) => [type, "open"])),
        schemes: "auth-required",
      }),
    })
    const action = mountView().find(".import-note-action")

    expect(action.exists()).toBe(true)
    await action.trigger("click")
    expect(auth.signIn).toHaveBeenCalled()
  })

  it("hides that sign-in while the login server is unreachable", () => {
    auth.isLoginConnected.value = false
    setQueue({
      blockedReason: ref("Importing this content type requires a sign-in."),
      typeAccess: ref({
        ...Object.fromEntries(IMPORTABLE_TYPES.map((type) => [type, "open"])),
        schemes: "auth-required",
      }),
    })
    const wrapper = mountView()

    expect(wrapper.find(".import-note-action").exists()).toBe(false)
    auth.isLoginConnected.value = true
  })

  it("warns inside the type option row when the data looks like another type", () => {
    setQueue({ hasTypeMismatch: ref(true) })
    const wrapper = mountView()
    const typeRow = wrapper
      .findAll(".import-option-row")
      .find((row) => row.find("#import-type").exists())

    expect(typeRow.find("#import-type-mismatch").text()).toMatch(
      /different content type/,
    )
    expect(typeRow.find("#import-type").attributes("aria-describedby")).toBe(
      "import-type-mismatch",
    )
    expect(wrapper.find(".import-source-summary").text()).not.toMatch(
      /different content type/,
    )
  })

  it("distinguishes the blocked note from the mismatch warning", () => {
    setQueue({
      blockedReason: ref("You are not authorized to import this content type."),
      hasTypeMismatch: ref(true),
    })
    const wrapper = mountView()

    expect(wrapper.find("#import-type-blocked svg").html()).not.toBe(
      wrapper.find("#import-type-mismatch svg").html(),
    )
  })

  it("gives each option its own labelled row", () => {
    const rows = mountView().findAll(".import-option-row")

    expect(rows).toHaveLength(2)
    expect(rows[0].find("label").attributes("for")).toBe("import-type")
    expect(rows[1].find("label").attributes("for")).toBe("import-bulk")
    expect(rows[1].find("#import-bulk").exists()).toBe(true)
  })

  it("drops the mismatch warning once nothing is pending", () => {
    setQueue({ hasTypeMismatch: ref(true), canImport: ref(false) })
    expect(mountView().find("#import-type-mismatch").exists()).toBe(false)
  })

  it("replaces the form with the outcome once an import succeeded", () => {
    setQueue({
      canImport: ref(false),
      result: ref({
        type: "schemes",
        count: 1,
        records: [
          { uri: "urn:test:scheme", prefLabel: { en: "Test Vocabulary" } },
        ],
      }),
    })
    const wrapper = mountView()
    const success = wrapper.find(".import-success")

    expect(success.text()).toMatch(/Test Vocabulary/)
    expect(success.text()).toMatch(/voc\.ndjson/)
    expect(wrapper.find(".import-dropzone").exists()).toBe(false)
    expect(wrapper.find("#import-type").exists()).toBe(false)
    expect(wrapper.find(".import-submit").exists()).toBe(false)
  })

  it("starts over from the outcome", async () => {
    setQueue({
      canImport: ref(false),
      result: ref({
        type: "schemes",
        count: 1,
        records: [
          { uri: "urn:test:scheme", prefLabel: { en: "Test Vocabulary" } },
        ],
      }),
    })
    const wrapper = mountView()
    await wrapper.find(".import-success-restart").trigger("click")

    expect(queue.reset).toHaveBeenCalled()
  })

  it("describes the URI handling as part of bulk mode", () => {
    const wrapper = mountView()
    const bulkRow = wrapper
      .findAll(".import-option-row")
      .find((row) => row.find("#import-bulk").exists())

    expect(bulkRow.find(".import-option-description").text()).toMatch(
      /replaces records with the same URI/,
    )
  })

  it("shows no confirmation before an import succeeded", () => {
    expect(mountView().find(".import-success").exists()).toBe(false)
  })

  it("stays quiet about the missing type before one is chosen", () => {
    setQueue({
      selectedType: ref(null),
      blockedReason: ref("Choose the content type of this source."),
    })
    expect(mountView().text()).not.toMatch(/Choose the content type/)
  })

  it("disables the import button while the selected type is blocked", () => {
    setQueue({
      blockedReason: ref("You are not authorized to import this content type."),
    })
    const wrapper = mountView()

    expect(wrapper.find(".import-submit").attributes("disabled")).toBeDefined()
    expect(wrapper.find("#import-type-blocked").exists()).toBe(true)
    expect(notify).not.toHaveBeenCalled()
  })

  it("marks the type field when importing without a type", async () => {
    setQueue({
      selectedType: ref(null),
      blockedReason: ref("Choose the content type of this source."),
    })
    const wrapper = mountView()
    const button = wrapper.find(".import-submit")

    expect(button.attributes("disabled")).toBeUndefined()
    await button.trigger("click")

    expect(wrapper.find("#import-type-required").text()).toMatch(
      /Choose the content type/,
    )
    expect(wrapper.find("#import-type").classes()).toContain("is-invalid")
    expect(wrapper.find("#import-type").attributes("aria-describedby")).toBe(
      "import-type-required",
    )
    expect(queue.startImport).not.toHaveBeenCalled()
    expect(notify).not.toHaveBeenCalled()
  })

  it("clears that mark as soon as a type is chosen", async () => {
    setQueue({
      selectedType: ref(null),
      blockedReason: ref("Choose the content type of this source."),
    })
    const wrapper = mountView()
    await wrapper.find(".import-submit").trigger("click")

    queue.selectedType.value = "schemes"
    await wrapper.vm.$nextTick()

    expect(wrapper.find("#import-type-required").exists()).toBe(false)
    expect(wrapper.find("#import-type").classes()).not.toContain("is-invalid")
  })

  it("replaces the whole view when nothing can be imported", () => {
    setQueue({
      unavailableReason: ref({
        access: "unsupported",
        title: "Import not available",
        text: "This server does not accept imports for any content type.",
      }),
    })
    const wrapper = mountView()

    expect(wrapper.text()).toMatch(/does not accept imports for any/)
    expect(wrapper.find(".import-dropzone").exists()).toBe(false)
    expect(wrapper.find("#import-type").exists()).toBe(false)
    expect(wrapper.find(".import-submit").exists()).toBe(false)
  })

  it("offers a sign-in only when signing in is what unblocks the import", async () => {
    setQueue({
      unavailableReason: ref({
        access: "auth-required",
        title: "Sign in to import",
        text: "Importing requires an account on this server.",
      }),
    })
    const wrapper = mountView()

    const button = wrapper.find(".import-unavailable button")
    expect(button.exists()).toBe(true)
    await button.trigger("click")
    expect(auth.signIn).toHaveBeenCalled()
  })

  it("hides the sign-in while the login server is unreachable", () => {
    auth.isLoginConnected.value = false
    setQueue({
      unavailableReason: ref({
        access: "auth-required",
        title: "Sign in to import",
        text: "Importing requires an account on this server.",
      }),
    })
    const wrapper = mountView()

    expect(wrapper.find(".import-unavailable button").exists()).toBe(false)
    auth.isLoginConnected.value = true
  })

  it("cancels a running import", async () => {
    setQueue({ isUploading: ref(true), canImport: ref(false) })
    const wrapper = mountView()

    const cancel = wrapper
      .findAll("button")
      .find((button) => button.text() === "Cancel")
    await cancel.trigger("click")

    expect(queue.cancelImport).toHaveBeenCalled()
  })

  it("offers no cancel while nothing is running", () => {
    const wrapper = mountView()

    expect(
      wrapper.findAll("button").some((button) => button.text() === "Cancel"),
    ).toBe(false)
  })

  it("spins the import button while the import runs", () => {
    setQueue({ isUploading: ref(true), canImport: ref(false) })
    const wrapper = mountView()

    expect(wrapper.find(".import-submit .spinner-border").exists()).toBe(true)
  })

  it("points at the connection view without a server", () => {
    const wrapper = mount(ImportView, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: { server: { activeUrl: null } },
            stubActions: false,
          }),
          createRouter({
            history: createMemoryHistory(),
            routes: [
              { path: "/", component: { template: "<div/>" } },
              { path: "/connection", component: { template: "<div/>" } },
            ],
          }),
        ],
      },
    })
    expect(wrapper.find(".not-connected").exists()).toBe(true)
  })
})
