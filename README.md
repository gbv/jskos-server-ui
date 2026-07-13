# jskos-server-ui

[![CI](https://github.com/gbv/jskos-server-ui/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/gbv/jskos-server-ui/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/gbv/jskos-server-ui/branch/main/graph/badge.svg)](https://codecov.io/gh/gbv/jskos-server-ui)
[![GitHub release](https://img.shields.io/github/v/release/gbv/jskos-server-ui)](https://github.com/gbv/jskos-server-ui/releases)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/github/license/gbv/jskos-server-ui)](LICENSE)

A Vue 3 application providing a web-based frontend for [jskos-server](https://github.com/gbv/jskos-server) instances. Browse JSKOS data such as terminologies, concepts, mappings, concordances, or annotations via any compatible JSKOS Server. The application is not tied to a specific instance and can connect to any server at runtime.

## Features

- Connect to any [jskos-server](https://github.com/gbv/jskos-server) instance at runtime
- Overview dashboard for terminologies, mappings, concordances, and annotations
- Runtime configuration without rebuilding

## Technology

- [Vue 3](https://vuejs.org/) with Composition API (`<script setup>`)
- [Vite](https://vitejs.dev/) for build tooling
- [Pinia](https://pinia.vuejs.org/) for state management
- [Vue Router](https://router.vuejs.org/)
- [cocoda-sdk](https://github.com/gbv/cocoda-sdk) for all JSKOS Server API communication
- [jskos-vue](https://github.com/gbv/jskos-vue) for JSKOS-specific UI components
- [Bootstrap 5](https://getbootstrap.com/) and [bootstrap-vue-next](https://bootstrap-vue-next.github.io/bootstrap-vue-next/) for basic layout and UI

## Project structure

```
src/
├── components/        # Shared UI components
├── composables/       # Reusable Vue composables
├── router/            # Vue Router configuration
├── stores/            # Pinia stores
├── utils/             # Utility functions
├── views/             # Page-level view components
└── assets/styles/     # Global styles based on Cocoda and Bootstrap
public/
└── config.json        # Runtime configuration
docker/
├── config.json        # Runtime config for Docker deployments
└── nginx.conf         # nginx configuration for the production container
```

## Installation

Requires Node.js 22 or higher.

```bash
npm install
```

## Components

This package is in a very early state of development so its components are not fixed yet. Some preliminary components may also be moved to [jskos-vue](https://www.npmjs.com/package/jskos-vue).

### ServiceInfo

Shows basic metadata and capabilities of a [JSKOS Service](https://gbv.github.io/jskos/#service). This component does not interact with the service.

## Development

```bash
npm run dev
```

## Testing

Unit tests use [Vitest](https://vitest.dev/) with [happy-dom](https://github.com/capricorn86/happy-dom) and [@vue/test-utils](https://test-utils.vuejs.org/):

```bash
npm test            # Run all tests once
npm run test:watch  # Watch mode
npm run coverage    # Run coverage report
```

Coverage is reported to [Codecov](https://codecov.io/gh/gbv/jskos-server-ui) on every CI run.

## Build

Build the application to `app/`:

```bash
npm run app
```

Build the library to `dist/`:

```bash
npm run build
```

## Configuration

Runtime configuration is loaded from `public/config.json` at startup. This file is not bundled into the application and can be replaced at deploy time without rebuilding.

```json
{
  "services": [
    {
      "api": "http://bartoc.org/api-type/jskos",
      "endpoint": "http://localhost:3000"
    }
  ],
  "footer": {
    "links": [
      { "label": "Imprint", "url": "https://example.org/imprint" },
      { "label": "Privacy", "url": "https://example.org/privacy" },
      { "label": "Accessibility", "url": "https://example.org/accessibility" }
    ]
  },
  "login": {
    "url": "login.example.org/",
    "ssl": true
  }
}
```

| Property       | Type    | Description                                                   |
| -------------- | ------- | ------------------------------------------------------------- |
| `services`     | array   | [JSKOS Service] objects to choose from                        |
| `footer.links` | array   | Footer navigation links (`label` + `url`)                     |
| `login`        | object  | Optional [login-server] connection; omit to disable login     |
| `login.url`    | string  | Login server URL without protocol (e.g. `login.example.org/`) |
| `login.ssl`    | boolean | Connect via HTTPS/WSS (default: `true`)                       |

[JSKOS Service]: https://gbv.github.io/jskos/#service
[login-server]: https://github.com/gbv/login-server

## Deployment

### Docker Compose (recommended for production)

A ready-to-use `docker-compose.yml` is included in the root of this repository. It starts jskos-server-ui, [jskos-server](https://github.com/gbv/jskos-server), and MongoDB.

**Quick start:**

```bash
docker compose up -d
```

The UI is then available at `http://localhost:8080`, jskos-server at `http://localhost:3000`.

**Configuration:**

`docker/config.json` is mounted into the container at startup. Edit it to configure:

```json
{
  "services": [
    {
      "api": "http://bartoc.org/api-type/jskos",
      "endpoint": "http://localhost:3000"
    }
  ],
  "footer": {
    "links": [{ "label": "Imprint", "url": "https://example.org/imprint" }]
  }
}
```

### Docker (standalone)

To run only the UI against an existing jskos-server instance:

```bash
docker run -p 8080:80 \
  -v /path/to/config.json:/usr/share/nginx/html/config.json:ro \
  ghcr.io/gbv/jskos-server-ui:main
```

## Contributing

Contributions are welcome. Please follow the existing code conventions:

- All code, comments, and commit messages in English
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (enforced by commitlint)
- Use cocoda-sdk for all API calls (no direct calls to jskos-server)
- Check jskos-vue and bootstrap-vue-next before writing custom UI components

Releases are automated via [semantic-release](https://semantic-release.gitbook.io/) on every push to `main`.

## Related projects

- [jskos-server](https://github.com/gbv/jskos-server) (backend server this application connects to)
- [jskos-vue](https://github.com/gbv/jskos-vue) (Vue 3 component library for JSKOS data)
- [cocoda-sdk](https://github.com/gbv/cocoda-sdk) (JavaScript SDK for JSKOS APIs)

## License

MIT, see [LICENSE](LICENSE) for details.
