import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router"
import HomePage from "../pages/home-page/home-page.vue"
import IndexPage from "../pages/index-page/index-page.vue"
import LoginPage from "../pages/login-page/login-page.vue"
import DetailPage from "../pages/detail-page/detail-page.vue"

// 扩展 vue-router 下的 RouteMeta 接口
declare module 'vue-router' {
  interface RouteMeta {
    keepAlive?: boolean
    sidebar?: boolean
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: "/home",
    component: HomePage,
    name: "home",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/login",
    component: LoginPage,
    name: "login",
    meta: {
      keepAlive: true,
    }
  },
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
    path: "/:contentId(\\w{10,})",
    component: DetailPage,
    name: "detail",
    meta: {
      keepAlive: true,
      sidebar: true,
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export { router }