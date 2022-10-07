import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router"

const HomePage = () => import("../pages/home-page/home-page.vue")
const LoginPage = () => import("../pages/login-page/login-page.vue")
const IndexPage = () => import("../pages/index-page/index-page.vue")
const DetailPage = () => import("../pages/detail-page/detail-page.vue")
const LeftSidebar = () => import("../views/side-bar/side-bar.vue")

// 扩展 vue-router 下的 RouteMeta 接口
declare module 'vue-router' {
  interface RouteMeta {
    keepAlive?: boolean
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
    components: {
      default: IndexPage,
      LeftSidebar,
    },
    name: "index",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/:contentId(\\w{10,})",
    components: {
      default: DetailPage,
      LeftSidebar,
    },
    name: "detail",
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