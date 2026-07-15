/**
 * Factory for a mock cocoda-sdk registry instance.
 * Override individual methods per test via the overrides parameter.
 */
export function makeRegistry(overrides = {}) {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    _config: {
      title: "Test Server",
      version: "1.0",
      serverVersion: "2.0",
      baseUrl: "http://localhost:3000/",
      env: "test",
      auth: false,
      schemes: { read: {} },
      mappings: { read: {}, create: { auth: true } },
      concordances: { read: {} },
      annotations: { read: {} },
    },
    getSchemes: vi.fn().mockResolvedValue(makeCountResponse(5)),
    getMappings: vi.fn().mockResolvedValue(makeCountResponse(100)),
    getConcordances: vi.fn().mockResolvedValue(makeCountResponse(3)),
    getAnnotations: vi.fn().mockResolvedValue(makeCountResponse(0)),
    setAuth: vi.fn(),
    isAuthorizedFor: vi.fn(() => true),
    ...overrides,
  }
}

/**
 * Creates an array with a non-enumerable _totalCount property,
 * matching the actual cocoda-sdk response shape.
 */
export function makeCountResponse(totalCount, items = []) {
  const result = [...items]
  Object.defineProperty(result, "_totalCount", {
    value: totalCount,
    enumerable: false,
  })
  return result
}
