export function mockFetchSuccess(data) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  )
}

export function mockFetchFailure(status = 404) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }))
}

export function mockFetchNetworkError() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new TypeError("Network error")),
  )
}

export function mockMatchMedia(prefersDark = false) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query) => ({
      matches: prefersDark && query === "(prefers-color-scheme: dark)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}
