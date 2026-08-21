import { useNotify } from "@/composables/useNotify"
import ToastMessage from "@/components/ToastMessage.vue"

const create = vi.hoisted(() => vi.fn())

vi.mock("bootstrap-vue-next", () => ({
  useToast: () => ({ create }),
}))

function lastToast() {
  return create.mock.calls.at(-1)[0]
}

function renderedBody() {
  return lastToast().slots.default()
}

describe("useNotify", () => {
  beforeEach(() => {
    create.mockClear()
  })

  it("shows an info toast by default", () => {
    useNotify().notify("Something happened.")

    const toast = lastToast()
    expect(toast.variant).toBe("info")
    expect(toast.pos).toBe("bottom-end")
    expect(renderedBody().props).toMatchObject({
      body: "Something happened.",
      variant: "info",
    })
  })

  it("renders the message through ToastMessage", () => {
    useNotify().notify("Imported 1 record.", "success")

    expect(renderedBody().type).toBe(ToastMessage)
  })

  it("turns the close button white on colored variants", () => {
    const { notify } = useNotify()

    for (const variant of ["success", "warning", "danger"]) {
      notify("Message", variant)
      expect(lastToast().closeClass).toBe("btn-close-white")
    }

    notify("Message", "info")
    expect(lastToast().closeClass).toBeUndefined()
  })

  it("keeps a failure on screen longer than a confirmation", () => {
    const { notify } = useNotify()

    notify("It failed.", "danger")
    const failure = lastToast().modelValue

    notify("It worked.", "success")
    expect(failure).toBeGreaterThan(lastToast().modelValue)
  })
})
