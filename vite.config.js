import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import Icons from "unplugin-icons/vite"
import { fileURLToPath, URL } from "node:url"
import { resolve } from "path"
import { version } from "./package.json"

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
    __APP_VERSION__: JSON.stringify(process.env.APP_VERSION || version),
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
