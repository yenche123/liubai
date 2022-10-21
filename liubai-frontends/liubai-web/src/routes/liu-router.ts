import { onUnmounted, reactive, ref, Ref } from "vue"
import { 
  useRouter as useVueRouter, 
  useRoute as useVueRoute,
  isNavigationFailure, 
  Router as VueRouter, 
  RouteLocationRaw,
  NavigationFailure,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  useLink,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  NavigationGuard,
} from "vue-router"
import time from "../utils/time"
import { isSameRoute } from "./route-util"

interface RouteChangeState {
  operation?: "push" | "replace" | "go"
  delta?: number
}

interface RouteAndRouter {
  route: RouteLocationNormalizedLoaded
  router: VueRouter
}

export interface RouteAndLiuRouter {
  route: RouteLocationNormalizedLoaded
  router: LiuRouter
}

interface ToAndFrom {
  to?: RouteLocationNormalized
  from?: RouteLocationNormalized
  stamp?: number
}

export type VueRoute = RouteLocationNormalizedLoaded

// 当前路由是否有前路由
let lastHasPrev = ref(false)

// 等待原生事件 存储 to 和 from
let toAndFrom: ToAndFrom = {}

// 原生 popstate 的 state
let stateFromPopState: PopStateEvent["state"] = null
let lastSetPopStateStamp = 0

// 有效间隔
// 超出有效间隔的事件，皆视为由浏览器所触发
// 如果在切换路由过程中含有远程获取云端数据，请主动调大间隔
const DEFAULT_DURATION = 60
let availableDuration = 60

// 上一次主动记录堆栈的事件戳
let routeChangeTmpData: RouteChangeState = {}

// 路由堆栈记录
// 仅会记录 刷新/从外部网页跳转回来/从外部网页跳转进来 之后的堆栈
let stack: RouteLocationNormalized[] = []

// 依序从 hasPreviousRouteInApp() 调用顺序
// 存储是否有前一页的 ref
// 请不要改变 hasPrevList 的顺序
let hasPrevList: Ref<boolean>[] = []

class LiuRouter {

  private router: VueRouter

  constructor() {
    this.router = useVueRouter()
  }

  /** 主动记录堆栈 */
  async replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined> {
    routeChangeTmpData = { operation: "replace", delta: 0 }
    let res = await this.router.replace(to)
    return res
  }

  /** 主动记录堆栈 */
  async push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined> {
    routeChangeTmpData = { operation: "push", delta: 1 }
    let res = await this.router.push(to)
    return res
  }

  public go(delta: number) {
    routeChangeTmpData = { operation: "go", delta }
    this.router.go(delta)
  }

  public forward() {
    routeChangeTmpData = { operation: "go", delta: 1 }
    this.router.forward()
  }

  // 调用该方法不见得会改变顶部地址栏，因为可能操作的是 iframe（其他上下文）内的返回
  public back() {
    routeChangeTmpData = { operation: "go", delta: -1 }
    this.router.back()
  }

  // 获取路由堆栈
  public getStack(): RouteLocationNormalized[] {
    let list = stack.map(v => {
      let v2 = Object.assign({}, v)
      return v2
    })
    return list
  }

  // 添加一个导航守卫，在任何导航前执行
  public beforeEach(guard: NavigationGuard): () => void {
    return this.router.beforeEach(guard)
  }

  // 添加一个导航守卫，在导航即将解析之前执行
  public beforeResolve(guard: NavigationGuard): () => void {
    return this.router.beforeResolve(guard)
  }

  public naviBack() {
    let list = this.getStack()
    if(list.length > 1) {
      this.back()
      return
    }

    // 导航去首页
    this.goHome()
  }

  // 导航去首页
  // 【待完善】注意区别登录态和工作区
  public goHome() {
    this.replace({ name: "index" })
  }

}

const _popStacks = (num: number) => {
  for(let i=0; i<num; i++) {
    if(stack.length < 1) break
    stack.pop()
  }
}

const _changeLastHasPrev = (val: boolean) => {
  lastHasPrev.value = val
  const len = hasPrevList.length
  if(len > 0) {
    hasPrevList[len - 1].value = val
  }
}

// 判断前端代码触发跳转成功与否，并操作堆栈
// 如果是浏览器导航栏的操作，则存储 to 和 from，再触发 _judgeBrowserJump
const _judgeInitiativeJump = (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  let { operation, delta = 0 } = routeChangeTmpData
  if(operation) {
    if(delta === 1) stack.push(to)
    else if(delta === 0) {
      stack.splice(stack.length - 1, 1, to)
    }
    else if(delta < 0) {
      _popStacks(-delta)
    }

    // 判断是否有前一页
    if(to.name && from.name && stack.length > 1) {
      // 如果有前一页
      _changeLastHasPrev(true)
    }

    routeChangeTmpData = {}
  }
  else {
    // 保存状态以等待 window.addEventListener("popstate") 触发
    toAndFrom = { to, from, stamp: time.getLocalTime() }
    _judgeBrowserJump()
  }
}

const _judgeBrowserJump = (): void => {
  let { to, from, stamp = 0 } = toAndFrom
  if(!to || !from || !stateFromPopState) return


  const now = time.getLocalTime()
  const diff = now - stamp
  const diff2 = now - lastSetPopStateStamp
  if(diff > availableDuration || diff2 > availableDuration) return
  
  const { current, forward, back } = stateFromPopState

  if(!back) {
    // 当前为第一页时
    stack = [to]
    _changeLastHasPrev(false)
  }
  else {
    // 当前为第 2、3.... 页
    _changeLastHasPrev(true)

    // 由后往前查找 current 是否在 stack 里
    const oldStackLen = stack.length
    let hasFindCurrent = false
    for(let i=oldStackLen-1; i>=0; i--) {
      const v = stack[i]
      const isSame = isSameRoute(current, v)
      if(!isSame) continue
      hasFindCurrent = true

      // 找到 current 时，发现该索引之后还存在数据，就去删掉
      const nextIdx = i + 1
      if(oldStackLen > nextIdx) {
        stack.splice(nextIdx, oldStackLen - nextIdx)
      }
      break
    }

    // 如果没有找到 current，那么就在最后插入 to
    if(!hasFindCurrent) {
      stack.push(to)
    }

    // 如果 from 存在
    // 并且 浏览器没有后一页（代表 from 不可能是浏览器的后一页）
    // 再并且浏览器的前一页跟 from 不一致
    //   则在最后的前一个索引插入 from
    if(from.name && !forward && !isSameRoute(back, from)) {
      const isSame2 = isSameRoute(back, from)
      if(!isSame2) stack.splice(stack.length - 1, 0, from)
    }
  }

  stateFromPopState = null
  toAndFrom.to = undefined
  toAndFrom.from = undefined
}


const initLiuRouter = (): RouteAndRouter => {
  const vueRouter = useVueRouter()
  const vueRoute = useVueRoute()

  let cancelAfterEach = vueRouter.afterEach((to, from, failure) => {
    // console.log("########  监听到路由已发生变化  ########")
    if(isNavigationFailure(failure)) return

    // console.log("to: ", to)
    // console.log("from: ", from)
    // console.log(" ")
    
    // 判断是不是第一个路由
    if(stack.length === 0 && !from.name) {
      stack.push(to)
      return
    }

    _judgeInitiativeJump(to, from)
  })

  const _listenPopState = (e: PopStateEvent) => {
    // console.log("popstate...........")
    // console.log(e)
    // console.log(" ")

    stateFromPopState = e.state
    lastSetPopStateStamp = time.getLocalTime()
    _judgeBrowserJump()
  }

  // iframe 内的路由历史变化（前进或后退） 不会在这里触发
  window.addEventListener("popstate", _listenPopState)

  onUnmounted(() => {
    cancelAfterEach()
    window.removeEventListener("popstate", _listenPopState)
  })

  return { route: vueRoute, router: vueRouter }
}

// 借由 router.afterEach 来判断的
// 如果 from.name 不存在，就代表没有更多以前的 route
const hasPreviousRouteInApp = (): Ref<boolean> => {
  const prev = ref(lastHasPrev.value)
  hasPrevList.push(prev)
  return prev
}

const useRouter = (): LiuRouter => {
  return new LiuRouter()
}

const useRouteAndLiuRouter = (): RouteAndLiuRouter => {
  const router = new LiuRouter()
  const vueRoute = useVueRoute()
  return { router, route: vueRoute }
}

export {
  LiuRouter,
  initLiuRouter,
  hasPreviousRouteInApp,
  useRouter,
  useRouteAndLiuRouter,
  useLink,

  // 下面这两个监听方法，必须在 router-view 里的组件调用
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
}
