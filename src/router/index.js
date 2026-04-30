import { createRouter, createWebHashHistory } from "vue-router"
import OverviewView from "../views/OverviewView.vue"
import ConnectionView from "../views/ConnectionView.vue"

const placeholder = () => import("../views/PlaceholderView.vue")

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "overview", component: OverviewView },
    { path: "/connection", name: "connection", component: ConnectionView },
    { path: "/terminologies", name: "terminologies", component: placeholder },
    { path: "/concepts", name: "concepts", component: placeholder },
    { path: "/concordances", name: "concordances", component: placeholder },
    { path: "/mappings", name: "mappings", component: placeholder },
    { path: "/registries", name: "registries", component: placeholder },
    { path: "/annotations", name: "annotations", component: placeholder },
  ],
})
