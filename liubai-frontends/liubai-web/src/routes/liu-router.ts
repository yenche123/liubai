import { onUnmounted } from "vue"
import { 
  useRouter as useVueRouter, 
  useRoute as useVueRoute,
  isNavigationFailure, 
  Router as VueRouter, 
  RouteLocationRaw,
  NavigationFailure,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  useLink,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  type NavigationGuard,
  type LocationQuery,
} from "vue-router"
import valTool from "~/utils/basic/val-tool"
import { isSameRoute } from "./route-util"
import cui from "~/components/custom-ui"
import type { SimpleFunc } from "~/utils/basic/type-tool"
import type { ToRoute, RouteItem } from "~/types"

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

export type VueRoute = RouteLocationNormalizedLoaded

// 上一次主动记录堆栈的事件戳
let routeChangeTmpData: RouteChangeState = {}

// 路由堆栈记录
// 仅会记录 刷新/从外部网页跳转回来/从外部网页跳转进来 之后的堆栈
let stack: RouteItem[] = []

class LiuRouter {

  private router: VueRouter

  constructor() {
    this.router = useVueRouter()
  }

  async replace(to: RouteLocationRaw) {
    routeChangeTmpData = { operation: "replace", delta: 0 }
    let res = await this.router.replace(to)
    return res
  }

  /** 用新的参数，取代当前页面 */
  async replaceWithNewQuery(
    route: RouteLocationNormalizedLoaded,
    newQuery: Record<string, string> | LocationQuery,
  ) {
    const { name, params } = route
    if(typeof name !== "string") {
      console.warn("当前的 route.name 不是 string 类型，无法执行 replaceWithNewQuery")
      return
    }
    let newRoute: RouteLocationRaw = { name, params, query: newQuery }
    let res = await this.replace(newRoute)
    return res
  }

  async push(to: RouteLocationRaw) {
    routeChangeTmpData = { operation: "push", delta: 1 }
    let res = await this.router.push(to)
    return res
  }

  /** 自定义携带新的 query 的 push 情况  */
  async pushCurrentWithNewQuery(
    route: RouteLocationNormalizedLoaded,
    query: Record<string, string>,
    reserveTags: boolean = true,
  ) {
    const { name, params, query: oldQuery } = route
    const newQuery = { ...query }

    if(typeof name !== "string") {
      console.warn("当前的 route.name 不是 string 类型，无法执行 pushCurrentWithNewQuery")
      return
    }

    // 如果是左侧侧边栏显示 tags 时，依然保持显示标签
    const tags = oldQuery.tags
    if(reserveTags && valTool.isStringWithVal(tags)) {
      newQuery.tags = tags
    }

    let res = await this.push({ name, query: newQuery, params })
    return res
  }

  /** 保留现有的 query 但是打开新的页面 */
  async pushNewPageWithOldQuery(
    route: RouteLocationNormalizedLoaded,
    to: RouteLocationRaw,
    trimQuery: boolean = false
  ): Promise<NavigationFailure | void | undefined | false> {
    const tmpRoute = this.router.resolve(to)

    if(route.query) {
      if(trimQuery) {
        const q = valTool.copyObject(route.query)
        delete q.cid
        delete q.outq
        tmpRoute.query = q
      }
      else {
        tmpRoute.query = route.query
      }
    }

    const newRoute = this.router.resolve(tmpRoute)
    if(newRoute.name === route.name && newRoute.fullPath === route.fullPath) {
      cui.showSnackBar({ text_key: "tip.its_right_here" })
      return false
    }

    let res = await this.push(newRoute)
    return res
  }

  /** 保留现有的 query 同时追加新的 query */
  async addNewQueryWithOldQuery(
    route: RouteLocationNormalizedLoaded,
    newQuery: Record<string, string>,
  ) {
    const { name, params } = route
    if(typeof name !== "string") {
      console.warn("当前的 route.name 不是 string 类型，无法执行 addNewQueryWithOldQuery")
      return
    }

    let q = valTool.copyObject(route.query)
    q = Object.assign(q, newQuery)
    let newRoute: RouteLocationRaw = { name, params, query: q }
    
    let res = await this.push(newRoute)
    return res
  }


  public resolve(
    to: RouteLocationRaw, 
    currentLocation?: RouteLocationNormalizedLoaded
  ) {
    const res = this.router.resolve(to, currentLocation)
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
  public getStack(): RouteItem[] {
    let list = stack.map(v => {
      let v2 = Object.assign({}, v)
      return v2
    })
    return list
  }

  // 添加一个导航守卫，在任何导航前执行
  public beforeEach(guard: NavigationGuard): SimpleFunc {
    return this.router.beforeEach(guard)
  }

  // 添加一个导航守卫，在导航即将解析之前执行
  public beforeResolve(guard: NavigationGuard): SimpleFunc {
    return this.router.beforeResolve(guard)
  }

  // isReady
  public isReady() {
    return this.router.isReady()
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

  private _go(
    route: RouteLocationNormalizedLoaded,
    pageNum: number,
  ) {
    if(pageNum === 0) {
      this.go(-1)
      return
    }
    if(pageNum > 9) {
      this.replaceWithNewQuery(route, {})
      return
    }
    this.go(-pageNum)
  }

  /**
   * 回退页面，直到 query 中没有 key 或者 key 跟 val 不匹配
   * @param route RouteLocationNormalizedLoaded
   * @param key query 中目标的属性
   * @param val query 中目标的属性值
   * @returns 
   */
  public naviBackUntilNoSpecificQuery(
    route: RouteLocationNormalizedLoaded,
    key: string,
    val?: string,
  ) {
    const list = this.getStack()
    if(list.length <= 1) {
      this.goHome()
      return
    }

    let delta = 0
    for(let i = list.length - 1; i >= 0; i--) {
      const v = list[i]
      const q = v.query
      if(!q) {
        this._go(route, delta)
        return
      }
      const q2 = q[key]
      if(!q2) {
        this._go(route, delta)
        return
      }
      if(val && q2 !== val) {
        this._go(route, delta)
        return
      }

      delta++
    }

    this.replaceWithNewQuery(route, {})
  }

  /**
   * 回退页面，直到与当前的 name 不一致
   * @param route 当前路由
   * @return void
   */
  public naviBackUtilNoSpecificName(
    route: RouteLocationNormalizedLoaded,
  ) {
    const name = route.name
    const list = this.getStack()
    if(list.length <= 1 || !name) {
      this.goHome()
      return
    }

    let delta = 0
    for(let i = list.length - 1; i >= 0; i--) {
      const v = list[i]
      const n = v.name
      if(n !== name) {
        this._go(route, delta)
        return
      }
      delta++
    }
    this.replaceWithNewQuery(route, {})
  }

  // 导航去首页
  // 【待完善】注意区别登录态和工作区
  public goHome() {
    this.replace({ name: "index" })
  }

  /** navigate to a TAB page */
  public switchTab(
    to: RouteLocationRaw,
    currentRoute: RouteLocationNormalizedLoaded,
  ) {
    const toRoute = this.resolve(to)
    const list = this.getStack()
    const num = this._getNaviBackStackNum(toRoute, currentRoute, list)

    // console.log("switchTab num: ", num)

    if(num > 0) {
      this.go(-num)
      return
    }
    
    this.push(toRoute)
  }

  /** 获取返回多少页面 可以到达 tab 页
   * 若没有 则返回 -1
   * 若当前页面就是 则返回 0
   */
  private _getNaviBackStackNum(
    toRoute: ToRoute, 
    fromRoute: RouteLocationNormalizedLoaded,
    list: RouteItem[],
  ) {
    if(fromRoute.name === toRoute.name) {
      return 0
    }
    const stackLength = list.length
  
    for(let i = stackLength-1; i >= 0; i--) {
      const curStack = list[i]
      if(curStack.name === toRoute.name) {
        return stackLength - (i + 1)
      }
    }
    return -1
  }

}

const _popStacks = (num: number) => {
  for(let i=0; i<num; i++) {
    if(stack.length < 1) break
    stack.pop()
  }
}

// 判断前端代码触发跳转成功与否，并操作堆栈
const _judgeInitiativeJump = (
  to: RouteLocationNormalized,
) => {
  let { operation, delta = 0 } = routeChangeTmpData

  // console.log("_judgeInitiativeJump 111:")
  // console.log(operation)
  // console.log(delta)

  if(operation) {
    if(delta === 1) stack.push(to)
    else if(delta === 0) {
      stack.splice(stack.length - 1, 1, to)
    }
    else if(delta < 0) {
      _popStacks(-delta)
    }
  
    // console.warn("see stack after _judgeInitiativeJump: ")
    // console.log(valTool.copyObject(stack))
    // console.log(" ")
  }

  _reset()
}

function _reset() {
  routeChangeTmpData = {}
}


// 判断浏览器导航栏的操作，并操作堆栈
const _judgeBrowserJump = (
  vueRouter: VueRouter,
  state: any,
): void => {
  // 1. get currentRoute
  const { current, back } = state
  if(!current) {
    console.warn("current is undefined!!!")
    return
  }
  const currentRoute = vueRouter.resolve(current)

  // 2. we're on the first page
  if(!back) {
    // console.warn("only one route!")
    stack = [currentRoute]
    return
  }

  // 3. search forward to see if `current` has been in stack
  const len3 = stack.length
  let hasFoundCurrent = false
  for(let i=len3-1; i>=0; i--) {
    const v = stack[i]
    const isSame = isSameRoute(currentRoute, v)
    if(!isSame) continue
    hasFoundCurrent = true

    // delete the index after current
    const nextIdx = i + 1
    if(len3 > nextIdx) {
      stack.splice(nextIdx, len3 - nextIdx)
    }
    break
  }

  // 4. if `current` not found, push it into stack
  if(!hasFoundCurrent) {
    stack.push(currentRoute)
  }

  // [start to check stack]
  // 5. check out `current` with `lastItem` from stack 
  const len5 = stack.length
  if(len5 < 1) {
    // console.log("len5 < 1")
    stack.push(currentRoute)
  }
  else {
    const lastItem = stack[len5 - 1]
    const isSame5 = isSameRoute(currentRoute, lastItem)
    // console.log("isSame5: ", isSame5)
    if(!isSame5) stack.push(currentRoute)
  }

  // 6. check out `back` with previous stack item
  if(back) {
    const backRoute = vueRouter.resolve(back)
    // console.log("backRoute: ")
    // console.log(valTool.copyObject(backRoute))

    const len6 = stack.length
    if(len6 <= 1) {
      // console.log("len6 <= 1")
      stack.unshift(backRoute)
    }
    else {
      const prevIdx = len6 - 2
      const prevItem = stack[prevIdx]
      const isSame6 = isSameRoute(backRoute, prevItem)
      // console.log("isSame6: ", isSame6)
      if(!isSame6) stack[prevIdx] = backRoute
    }
  }

  // console.warn("see stack after _judgeBrowserJump: ")
  // console.log(valTool.copyObject(stack))
  // console.log(" ")
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

    _judgeInitiativeJump(to)
  })

  const _listenPopState = (e: PopStateEvent) => {
    // console.log(" ")
    // console.log("popstate...........")
    // console.log(e.state)
    const state = e.state
    if(!state) {
      console.warn("state is undefined!!!")
      return
    }

    _judgeBrowserJump(vueRouter, state)
  }

  // iframe 内的路由历史变化（前进或后退） 不会在这里触发
  window.addEventListener("popstate", _listenPopState)

  onUnmounted(() => {
    cancelAfterEach()
    window.removeEventListener("popstate", _listenPopState)
  })

  return { route: vueRoute, router: vueRouter }
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
  useRouter,
  useRouteAndLiuRouter,
  useLink,

  // 下面这两个监听方法，必须在 router-view 里的组件调用
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
}
