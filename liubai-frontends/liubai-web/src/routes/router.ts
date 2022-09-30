import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router"
import HomePage from "../pages/home-page/home-page.vue"
import IndexPage from "../pages/index-page/index-page.vue"

// 扩展 vue-router 下的 RouteMeta 接口
declare module 'vue-router' {
  interface RouteMeta {
    keepAlive?: boolean
    sidebar?: boolean
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: IndexPage,
    name: "index",
    meta: {
      keepAlive: true,
      sidebar: true,
    }
  },
  {
    path: "/home",
    component: HomePage,
    name: "home",
    meta: {
      keepAlive: true,
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export { router }