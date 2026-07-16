<script setup>
import IconGithub from "~icons/bi/github"
import { useConfigStore } from "@/stores/config"
const config = useConfigStore()
const version = __APP_VERSION__
const githubUrl = "https://github.com/gbv/jskos-server-ui"
const mitUrl = "https://opensource.org/licenses/MIT"
const gbvUrl = "https://www.gbv.de"
</script>

<template>
  <footer
    class="app-footer d-flex justify-content-between align-items-center flex-wrap gap-3 px-3"
  >
    <span class="d-flex align-items-center gap-2">
      <span
        >JSKOS Server UI <span class="version">v{{ version }}</span></span
      >
      <span class="separator">·</span>
      <a
        :href="githubUrl"
        target="_blank"
        rel="noopener"
        class="github-link"
        aria-label="GitHub"
      >
        <IconGithub />
      </a>
      <span class="separator">·</span>
      <a :href="mitUrl" target="_blank" rel="noopener">MIT</a>
      <span class="separator">·</span>
      <a :href="gbvUrl" target="_blank" rel="noopener">© 2026 GBV</a>
    </span>
    <span class="d-flex align-items-center gap-1 flex-wrap">
      <template v-for="(link, i) in config.footerLinks" :key="link.label">
        <span v-if="i > 0" class="separator">|</span>
        <a :href="link.url || 'about:blank'" target="_blank" rel="noopener">{{
          link.label
        }}</a>
      </template>
    </span>
  </footer>
</template>
