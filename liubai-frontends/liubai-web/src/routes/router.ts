import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router"

const LeftSidebar = () => import("../views/side-bar/side-bar.vue")
const HomePage = () => import("../pages/level1/home-page/home-page.vue")
const LoginPage = () => import("../pages/level1/login-page/login-page.vue")
const IndexPage = () => import("../pages/level1/index-page/index-page.vue")
const DetailPage = () => import("../pages/level2/detail-page/detail-page.vue")
const FavoritePage = () => import("../pages/level2/favorite-page/favorite-page.vue")
const StatePage = () => import("../pages/level2/state-page/state-page.vue")
const TrashPage = () => import("../pages/level2/trash-page/trash-page.vue")
const TagPage = () => import("../pages/level2/tag-page/tag-page.vue")
const ConnectPage = () => import("../pages/level2/connect-page/connect-page.vue")
const EditPage = () => import("../pages/level2/edit-page/edit-page.vue")
const SettingPage = () => import("../pages/level3/setting-page/setting-page.vue")
const NotificationPage = () => import("../pages/level3/notification-page/notification-page.vue")


// 扩展 vue-router 下的 RouteMeta 接口
// inApp 为 false 表示不在应用内（可能在落地页 / share 分享内等等）
declare module 'vue-router' {
  interface RouteMeta {
    keepAlive?: boolean
    inApp?: boolean

    // 在 init-space.ts 中，是否要检查 workspace 的变化
    // 默认为 true 代表会检查
    // 目前 detail 和 edit 这两个 page 为 false 表示不必检查
    checkWorkspace?: boolean
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
      checkWorkspace: false,
    }
  },
  {
    path: "/:contentId(\\w{10,})/edit",
    components: {
      default: EditPage,
      LeftSidebar,
    },
    name: "edit",
    meta: {
      keepAlive: true,
      checkWorkspace: false,
    }
  },
  {
    path: "/tag/:tagId(\\w{20,})",
    components: {
      default: TagPage,
      LeftSidebar,
    },
    name: "tag",
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
    path: "/state",
    components: {
      default: StatePage,
      LeftSidebar,
    },
    name: "state",
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
  {
    path: "/setting",
    components: {
      default: SettingPage,
      LeftSidebar,
    },
    name: "setting",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/notification",
    components: {
      default: NotificationPage,
      LeftSidebar,
    },
    name: "notification",
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
    path: "/w/:workspaceId(\\w{10,})/tag/:tagId(\\w{20,})",
    components: {
      default: TagPage,
      LeftSidebar,
    },
    name: "collaborative-tag",
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
    path: "/w/:workspaceId(\\w{10,})/state",
    components: {
      default: StatePage,
      LeftSidebar,
    },
    name: "collaborative-state",
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
  {
    path: "/w/:workspaceId(\\w{10,})/setting",
    components: {
      default: SettingPage,
      LeftSidebar,
    },
    name: "collaborative-setting",
    meta: {
      keepAlive: true,
    }
  },
  {
    path: "/w/:workspaceId(\\w{10,})/notification",
    components: {
      default: NotificationPage,
      LeftSidebar,
    },
    name: "collaborative-notification",
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