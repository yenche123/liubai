
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
const A2hsPage = () => import("../pages/level3/a2hs-page/a2hs-page.vue")

export const routes: Array<RouteRecordRaw> = [
  /*************** 公共页面（不区分工作区） ***************/
  {
    path: "/home",
    component: HomePage,
    name: "home",
    meta: {
      inApp: false,
    }
  },
  {
    path: "/login",
    component: LoginPage,
    name: "login",
    meta: {
      inApp: false,
    }
  },
  {
    path: "/login-github",
    component: OAuthPage,
    name: "login-github",
    meta: {
      keepAlive: false,
      inApp: false,
    }
  },
  {
    path: "/login-google",
    component: OAuthPage,
    name: "login-google",
    meta: {
      keepAlive: false,
      inApp: false,
    }
  },
  {
    path: "/a2hs",
    component: A2hsPage,
    name: "a2hs",
    meta: {
      inApp: false,
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
      checkWorkspace: false,
      hasViceView: false,
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
      hasViceView: false,
      checkWorkspace: false,
    },
  },
  {
    path: "/:contentId(\\w{10,})",
    components: {
      default: DetailPage,
      LeftSidebar,
    },
    name: "detail",
    meta: {
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
      checkWorkspace: false,
    }
  },
  /*************** Personal Workspace ***************/
  {
    path: "/",
    components: {
      default: IndexPage,
      LeftSidebar,
    },
    name: "index",
    meta: {}
  },
  {
    path: "/tag/:tagId(\\w{18,})",
    components: {
      default: TagPage,
      LeftSidebar,
    },
    name: "tag",
    meta: {}
  },
  {
    path: "/favorite",
    components: {
      default: FavoritePage,
      LeftSidebar,
    },
    name: "favorite",
    meta: {}
  },
  {
    path: "/state",
    components: {
      default: StatePage,
      LeftSidebar,
    },
    name: "state",
    meta: {}
  },
  {
    path: "/state-more/:stateId(\\w{4,})",
    components: {
      default: StateMorePage,
      LeftSidebar,
    },
    name: "state-more",
    meta: {}
  },
  {
    path: "/trash",
    components: {
      default: TrashPage,
      LeftSidebar,
    },
    name: "trash",
    meta: {
      hasViceView: false,
    }
  },
  {
    path: "/connectors",
    components: {
      default: ConnectPage,
      LeftSidebar,
    },
    name: "connectors",
    meta: {
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
      inSetting: true,
      hasViceView: false,
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
      inSetting: true,
      hasViceView: false,
    }
  },
  {
    path: "/notification",
    components: {
      default: NotificationPage,
      LeftSidebar,
    },
    name: "notification",
    meta: {}
  },
  /********************* Collaborative Workspace ********************/
  {
    path: "/w/:workspaceId(\\w{10,})",
    components: {
      default: IndexPage,
      LeftSidebar,
    },
    name: "collaborative-index",
    meta: {}
  },
  {
    path: "/w/:workspaceId(\\w{10,})/tag/:tagId(\\w{18,})",
    components: {
      default: TagPage,
      LeftSidebar,
    },
    name: "collaborative-tag",
    meta: {}
  },
  {
    path: "/w/:workspaceId(\\w{10,})/favorite",
    components: {
      default: FavoritePage,
      LeftSidebar,
    },
    name: "collaborative-favorite",
    meta: {}
  },
  {
    path: "/w/:workspaceId(\\w{10,})/state",
    components: {
      default: StatePage,
      LeftSidebar,
    },
    name: "collaborative-state",
    meta: {}
  },
  {
    path: "/w/:workspaceId(\\w{10,})/state-more/:stateId(\\w{4,})",
    components: {
      default: StateMorePage,
      LeftSidebar,
    },
    name: "collaborative-state-more",
    meta: {}
  },
  {
    path: "/w/:workspaceId(\\w{10,})/trash",
    components: {
      default: TrashPage,
      LeftSidebar,
    },
    name: "collaborative-trash",
    meta: {
      hasViceView: false,
    }
  },
  {
    path: "/w/:workspaceId(\\w{10,})/connectors",
    components: {
      default: ConnectPage,
      LeftSidebar,
    },
    name: "collaborative-connectors",
    meta: {
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
      inSetting: true,
      hasViceView: false,
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
      hasViceView: false,
    }
  },
  {
    path: "/w/:workspaceId(\\w{10,})/notification",
    components: {
      default: NotificationPage,
      LeftSidebar,
    },
    name: "collaborative-notification",
    meta: {}
  },
  /***************** the rest of routes, redirect to root ****************/
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  }
]
