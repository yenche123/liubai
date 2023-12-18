import { createRouter, createWebHistory } from "vue-router"
import { routes } from "./initRoutes"
import liuEnv from "~/utils/liu-env"
import localCache from "~/utils/system/local-cache"

// 扩展 vue-router 下的 RouteMeta 接口
// inApp 为 false 表示不在应用内（可能在落地页 / share 分享内等等）
declare module 'vue-router' {
  interface RouteMeta {
    keepAlive?: boolean
    inApp?: boolean
    inSetting?: boolean     // 是否处于 setting 的子页中，默认为 false

    // 在 init-space.ts 中，是否要检查 workspace 的变化
    // 默认为 true 代表会检查
    // 目前 detail 和 edit 这两个 page 为 false 表示不必检查
    checkWorkspace?: boolean

    // 是否能打开 vice-view，默认为 true; inSetting 为 true 的，此值皆为 false
    hasViceView?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 创建全局守卫导航
router.beforeEach((to, from) => {
  const backend = liuEnv.hasBackend()
  if(!backend) return
  
  const hasLogin = localCache.hasLoginWithBackend()
  const toName = to.name
  const toInApp = to.meta.inApp

  // 1. 如果没有登录 
  // 2. 并且 打开应用内的页面（需要登录） 
  // 3. 并且 不是 login 页
  // 则路由至 login 页
  if(!hasLogin && toInApp !== false && toName !== "login") {
    return { name: "login" }
  }
})

export { router }