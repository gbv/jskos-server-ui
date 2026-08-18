import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import Icons from "unplugin-icons/vite"
import { execSync } from "node:child_process"
import { fileURLToPath, URL } from "node:url"
import { resolve } from "path"
import { version } from "./package.json"

/**
 * Determines the version to display in the application.
 *
 * Priority: APP_VERSION -> git tag -> commit
 *
 * @returns {string} the version from APP_VERSION, git, or package.json
 */
function resolveAppVersion() {
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION
  }
  try {
    const git = (command) =>
      execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim()
    const latestTag = git("git tag --list 'v*' --sort=-version:refname")
      .split("\n")[0]
      .replace(/^v/, "")
    const commit = git("git rev-parse --short HEAD")
    const isDirty = git("git status --porcelain") !== ""
    return `${latestTag || version}+${commit}${isDirty ? ".dirty" : ""}`
  } catch {
    return version
  }
}

var build = { outDir: "app" }

if (process.env.BUILD_MODE === "dist") {
  build = {
    lib: {
      entry: resolve(__dirname, "src/index.js"),
      name: "JskosServerUi",
    },
    rollupOptions: {
      external: ["vue", "bootstrap-vue-next", "cocoda-sdk"],
      output: {
        exports: "named",
        globals: {
          vue: "Vue",
          "bootstrap-vue-next": "BootstrapVueNext",
        },
      },
    },
  }
}

export default defineConfig({
  plugins: [vue(), Icons({ compiler: "vue3", scale: 1 })],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
  },
  build,
  base: "",
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./test/setup.js"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/assets/**", "src/main.js"],
    },
  },
})
