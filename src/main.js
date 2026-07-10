import { createApp } from "vue"
import { createPinia } from "pinia"
import { install as JskosVue } from "jskos-vue"
import { createBootstrap } from "bootstrap-vue-next"

import "bootstrap/dist/css/bootstrap.min.css"
import "./assets/styles/cocoda/colors.css"
import "./assets/styles/cocoda/text-styles.css"
import "./assets/styles/cocoda/utilities.css"
import "./assets/styles/cocoda/buttons.css"
import "./assets/styles/bootstrap-overrides.css"
import "jskos-vue/dist/style.css"
import "./assets/styles/jskos-vue-overrides.css"
import "bootstrap-vue-next/dist/bootstrap-vue-next.css"
import "./assets/styles/global.css"
import "./assets/styles/navbar.css"
import "./assets/styles/footer.css"
import "./assets/styles/overview.css"
import "./assets/styles/browse.css"
import "./assets/styles/theme-toggle.css"

import App from "./App.vue"
import router from "./router/index.js"

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(JskosVue)
app.use(createBootstrap())
app.mount("#app")
