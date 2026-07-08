# Login Integration Notes

Date: 2026-06-23

Context: issue `gbv/jskos-server-ui#37`, point 1. The goal is to add the
login-server UI integration by following the implementation pattern used in
`bartoc-search` on the `dev` branch.

## Scope

This work covers the client-side login widget and user status display. It does
not yet cover the follow-up auth bridge where a login-server token is passed to
the JSKOS API client.

## Implemented

- Added `gbv-login-client-vue` as a frontend dependency.
- Imported `gbv-login-client-vue/style` in `src/main.js`.
- Registered the `Login` and `UserStatus` plugins during app bootstrap.
- Loaded `config.json` before mounting the Vue app, so the login configuration is
  available before `Login.connect(...)` runs.
- Extended the Pinia config store with:
  - `login`
  - `loginEnabled`
  - `loaded`
  - `loading`
  - `error`
  - idempotent `loadConfig()`
- Added login configuration to both local config files:
  - `public/config.json`
  - `docker/config.json`
- Added `UserStatus` to the right side of `AppNavbar`, next to the existing
  navigation and theme toggle.
- Kept server disconnection conceptually separate from login/logout. The
  existing disconnect action still disconnects the current JSKOS server.
- Added focused config store tests for login config loading and idempotent
  config loading.

## AppNavbar

The right side of the navbar now contains:

- Overview
- Connection
- login/user status, when login is enabled
- dark/light theme toggle

The left side should keep the original visual structure:

- `JSKOS Service`
- connected service label/link when a server is active
- the existing server `Disconnect` button

This is intentional: login/logout belongs to account UX, while `Disconnect`
belongs to the JSKOS server connection state.

## Local Development Notes

When running through the Docker image, frontend source edits may not hot reload
in the browser because the built/static app is served from the container.

The simplest local workflow is:

- keep Docker for the backend/server dependencies
- run the UI with Vite locally via `npm run dev`
- use `public/config.json` for the local Vite app
- keep `docker/config.json` for the Docker-served app

## Login-Server Debug Notes

During localhost testing against `https://bartoc.org/login/`, the browser can
show CORS and third-party cookie warnings for login-server HTTP resources. The
important signal for the Vue login widget is the login-server message stream.

Observed message flow:

- `providers`
- `authenticated`
- initially `loggedOut`
- after interactive login, the widget successfully detected the active user

So the component can work locally even if the browser console shows warnings for
some auxiliary cross-origin requests.

## Not Implemented Yet

Point 2 is still open. That likely means wiring the login result into the JSKOS
API layer, similar to the `bartoc-search` helper that checks auth state and calls
the SDK auth setter. This should be treated as a separate step because it changes
API request behavior, not only navbar/account UI.

## Verification

Focused tests were run during the integration work:

```sh
npm test -- test/stores/config.test.js test/App.test.js
```

The app build check was also run:

```sh
npm run app
```

`npm run app` completed with an existing warning from `jskos-vue` CSS parsing
around `:deep(...)`; that warning is unrelated to the login changes.

## Full Test Suite Notes

The full test suite currently has two failing tests:

```sh
npm test
```

Failing tests:

- `test/views/OverviewView.test.js`
  - `renders all five cards when all capabilities are set`
  - `still renders successful cards when only one fetch errors`

Both fail for the same reason: the tests expect 6 `.type-card` elements, but
`OverviewView.vue` renders 7.

The extra card is likely `Types`. `OverviewView.vue` defines 7 entries in
`STATS`, including `types`. In the failing tests, `types` is not present in the
mocked capabilities object, so its value is `undefined`. The template condition
currently checks:

```vue
v-if="store.capabilities?.[s.key] !== null"
```

Because `undefined !== null` is `true`, the `Types` card is rendered. The tests
seem to assume that a missing capability should behave like an unavailable
capability.

There is also a non-failing Vue Router warning during these tests:

```txt
No match found for location with path "/registries"
```

This comes from the test router stub missing the `/registries` route. The real
application router includes that route, so this warning is not the cause of the
test failures.
