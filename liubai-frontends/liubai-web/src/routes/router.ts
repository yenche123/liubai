import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router"

const HomePage = () => import("../pages/level1/home-page/home-page.vue")
const LoginPage = () => import("../pages/level1/login-page/login-page.vue")
const IndexPage = () => import("../pages/level1/index-page/index-page.vue")
const DetailPage = () => import("../pages/level2/detail-page/detail-page.vue")
const FavoritePage = () => import("../pages/level2/favorite-page/favorite-page.vue")
const KanbanPage = () => import("../pages/level2/kanban-page/kanban-page.vue")
const TrashPage = () => import("../pages/level2/trash-page/trash-page.vue")
const ConnectPage = () => import("../pages/level2/connect-page/connect-page.vue")
const LeftSidebar = () => import("../views/side-bar/side-bar.vue")

// 扩展 vue-router 下的 RouteMeta 接口
// inApp 为 false 表示不在应用内（可能在落地页内等等）
declare module 'vue-router' {
  interface RouteMeta {
    keepAlive?: boolean
    inApp?: boolean
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: "/home",
    component: HomePage,
    name: "home",
    meta: {
      keepAlive: true,
      inApp: false,
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
  },
  {
    path: "/favorite",
    components: {
      default: FavoritePage,
      LeftSidebar,
    },
    name: "favorite",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/kanban",
    components: {
      default: KanbanPage,
      LeftSidebar,
    },
    name: "kanban",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/trash",
    components: {
      default: TrashPage,
      LeftSidebar,
    },
    name: "trash",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/connect",
    components: {
      default: ConnectPage,
      LeftSidebar,
    },
    name: "connect",
    meta: {
      keepAlive: true,
    }
  },
  /************************** 协作工作区 ***********************/
  {
    path: "/w/:workspaceId(\\w{10,})",
    components: {
      default: IndexPage,
      LeftSidebar,
    },
    name: "collaborative-index",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/w/:workspaceId(\\w{10,})/favorite",
    components: {
      default: FavoritePage,
      LeftSidebar,
    },
    name: "collaborative-favorite",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/w/:workspaceId(\\w{10,})/kanban",
    components: {
      default: KanbanPage,
      LeftSidebar,
    },
    name: "collaborative-kanban",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/w/:workspaceId(\\w{10,})/trash",
    components: {
      default: TrashPage,
      LeftSidebar,
    },
    name: "collaborative-trash",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/w/:workspaceId(\\w{10,})/connect",
    components: {
      default: ConnectPage,
      LeftSidebar,
    },
    name: "collaborative-connect",
    meta: {
      keepAlive: true,
    }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export { router }