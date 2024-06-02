
import { type RouteRecordRaw } from "vue-router"

const LeftSidebar = () => import("../views/side-bar/side-bar.vue")
const HomePage = () => import("../pages/level1/home-page/home-page.vue")
const LoginPage = () => import("../pages/level1/login-page/login-page.vue")
const OAuthPage = () => import("../pages/level1/oauth-page/oauth-page.vue")
const IndexPage = () => import("../pages/level1/index-page/index-page.vue")
const DetailPage = () => import("../pages/level2/detail-page/detail-page.vue")
const CommentPage = () => import("../pages/level2/comment-page/comment-page.vue")
const FavoritePage = () => import("../pages/level2/favorite-page/favorite-page.vue")
const StatePage = () => import("../pages/level2/state-page/state-page.vue")
const StateMorePage = () => import("../pages/level2/state-more-page/state-more-page.vue")
const TrashPage = () => import("../pages/level2/trash-page/trash-page.vue")
const TagPage = () => import("../pages/level2/tag-page/tag-page.vue")
const ConnectPage = () => import("../pages/level2/connect-page/connect-page.vue")
const EditPage = () => import("../pages/level2/edit-page/edit-page.vue")
const SettingPage = () => import("../pages/level3/setting-page/setting-page.vue")
const NotificationPage = () => import("../pages/level3/notification-page/notification-page.vue")
const ExportPage = () => import("../pages/level3/setting-page/export-page/export-page.vue")
const ImportPage = () => import("../pages/level3/setting-page/import-page/import-page.vue")
const SubscribePage = () => import("../pages/level3/payments/subscribe-page/subscribe-page.vue")
const PaymentSuccessPage = () => import("../pages/level3/payments/success-page/success-page.vue")

export const routes: Array<RouteRecordRaw> = [
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
      inApp: false,
    }
  },
  {
    path: "/login-github",
    component: OAuthPage,
    name: "login-github",
    meta: {
      inApp: false,
    }
  },
  {
    path: "/login-google",
    component: OAuthPage,
    name: "login-google",
    meta: {
      inApp: false,
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
    path: "/c/:commentId(\\w{10,})",
    components: {
      default: CommentPage,
      LeftSidebar,
    },
    name: "comment",
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
    path: "/tag/:tagId(\\w{18,})",
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
    path: "/state-more/:stateId(\\w{4,})",
    components: {
      default: StateMorePage,
      LeftSidebar,
    },
    name: "state-more",
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
      hasViceView: false,
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
      hasViceView: false,
    }
  },
  {
    path: "/settings",
    components: {
      default: SettingPage,
      LeftSidebar,
    },
    name: "setting",
    meta: {
      keepAlive: true,
      inSetting: true,
    }
  },
  {
    path: "/export",
    components: {
      default: ExportPage,
      LeftSidebar,
    },
    name: "export",
    meta: {
      keepAlive: true,
      inSetting: true,
    }
  },
  {
    path: "/import",
    components: {
      default: ImportPage,
      LeftSidebar,
    },
    name: "import",
    meta: {
      keepAlive: true,
      inSetting: true,
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
  {
    path: "/subscription",
    components: {
      default: SubscribePage,
      LeftSidebar,
    },
    name: "subscription",
    meta: {
      keepAlive: true,
      checkWorkspace: false,
    },
  },
  {
    path: "/payment-success",
    components: {
      default: PaymentSuccessPage,
      LeftSidebar,
    },
    name: "payment-success",
    meta: {
      keepAlive: true,
      checkWorkspace: false,
    },
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
    path: "/w/:workspaceId(\\w{10,})/tag/:tagId(\\w{18,})",
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
    path: "/w/:workspaceId(\\w{10,})/state-more/:stateId(\\w{4,})",
    components: {
      default: StateMorePage,
      LeftSidebar,
    },
    name: "collaborative-state-more",
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
      hasViceView: false,
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
      hasViceView: false,
    }
  },
  {
    path: "/w/:workspaceId(\\w{10,})/settings",
    components: {
      default: SettingPage,
      LeftSidebar,
    },
    name: "collaborative-setting",
    meta: {
      keepAlive: true,
      inSetting: true,
    }
  },
  {
    path: "/w/:workspaceId(\\w{10,})/export",
    components: {
      default: ExportPage,
      LeftSidebar,
    },
    name: "collaborative-export",
    meta: {
      keepAlive: true,
      inSetting: true,
    }
  },
  {
    path: "/w/:workspaceId(\\w{10,})/import",
    components: {
      default: ImportPage,
      LeftSidebar,
    },
    name: "collaborative-import",
    meta: {
      inSetting: true,
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
