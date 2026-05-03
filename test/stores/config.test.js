import { setActivePinia, createPinia } from "pinia"
import { useConfigStore } from "@/stores/config"
import { mockFetchSuccess, mockFetchFailure } from "../helpers.js"

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useConfigStore", () => {
  it("starts with null defaultServer and empty footerLinks", () => {
    const store = useConfigStore()
    expect(store.defaultServer).toBeNull()
    expect(store.footerLinks).toEqual([])
  })

  it("sets defaultServer from config.json", async () => {
    mockFetchSuccess({ defaultServer: "http://example.org/" })
    const store = useConfigStore()
    await store.loadConfig()
    expect(store.defaultServer).toBe("http://example.org/")
  })

  it("sets footerLinks from config.json", async () => {
    const links = [{ label: "Impressum", url: "http://example.org/impressum" }]
    mockFetchSuccess({ footer: { links } })
    const store = useConfigStore()
    await store.loadConfig()
    expect(store.footerLinks).toEqual(links)
  })

  it("defaults to null/[] when keys are absent from response", async () => {
    mockFetchSuccess({})
    const store = useConfigStore()
    await store.loadConfig()
    expect(store.defaultServer).toBeNull()
    expect(store.footerLinks).toEqual([])
  })

  it("leaves state unchanged when fetch returns non-ok status", async () => {
    mockFetchFailure(404)
    const store = useConfigStore()
    await store.loadConfig()
    expect(store.defaultServer).toBeNull()
    expect(store.footerLinks).toEqual([])
  })
})
