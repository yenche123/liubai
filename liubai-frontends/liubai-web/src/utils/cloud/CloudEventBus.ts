import { 
  ref,
  watch,
  readonly,
  type WatchStopHandle,
} from "vue"
import { 
  useRouteAndLiuRouter,
  type RouteAndLiuRouter
} from "~/routes/liu-router"
import {
  useDocumentVisibility, 
  useThrottleFn,
  usePageLeave,
  useWindowFocus,
  useIdle,
} from "~/hooks/useVueUse";
import { 
  fetchHelloWorld, 
  fetchUserEnter, 
  fetchLatestUser,
} from "./tools/requests";
import time from "../basic/time";
import localCache from "../system/local-cache";
import liuEnv from "../liu-env";
import { logout } from "./tools/logout";
import { afterGettingUserData } from "./tools/after-getting-user-data";
import type { BoolFunc, LiuTimeout } from "~/utils/basic/type-tool"
import valTool from "../basic/val-tool";
import { waitEnterIntoApp } from "~/hooks/useEnterIntoApp";
import { getUser } from "./tools/some-funcs";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import liuConsole from "../debug/liu-console";
import { useNetworkStore } from "~/hooks/stores/useNetworkStore";
import { storeToRefs } from "pinia";

const SEC_25 = 25 * time.SECONED
const MIN_5 = 5 * time.MINUTE
const MIN_25 = 25 * time.MINUTE

// 事件总线，对云同步任务进行调度
class CloudEventBus {

  private static rr: RouteAndLiuRouter

  // 时间是否已校准
  private static isTimeCalibrated = false

  // 其他外部函数都监听该值的递增，再去做其他响应
  private static syncNum = ref(0)

  // 是否正在 main 流程中
  private static isMaining = false

  // 上一次完成 main() 流程的时间戳
  private static lastFinishMainStamp = 0

  // 上一次 user enter 的时间戳
  private static lastUserEnterStamp = 0

  static init() {
    const backend = liuEnv.hasBackend()
    if(!backend) return

    let _this = this
    this.rr = useRouteAndLiuRouter()

    const preMain = useThrottleFn(() => {
      _this.main()
    }, 3500)


    // 监听网络、窗口是否可视、鼠标是否已经离开当前窗口......等变化
    const visibility = useDocumentVisibility()
    const hasLeftPage = usePageLeave()
    const nStore = useNetworkStore()
    const focused = useWindowFocus()
    const { idle } = useIdle()
    const { level: netLevel } = storeToRefs(nStore)

    watch([netLevel, visibility, hasLeftPage, focused, idle], (
      [newV1, newV2, newV3, newV4, newV5],
      [oldV1, oldV2, oldV3, oldV4, oldV5],
    ) => {

      // 当前分页被隐藏，并且非刚启动时（刚启动时，oldV2 为 undefined）
      if(newV2 === "hidden" && oldV2) return
      if(!newV1) return

      if(!_this.isTimeCalibrated) {
        preMain()
        return
      }

      if(newV1 && !oldV1) {
        preMain()
        return
      }

      if(newV2 === "visible" && oldV2 === "hidden") {
        preMain()
        return
      }

      // had left the window and now it's back
      if(!newV3 && oldV3) {
        preMain()
        return
      }

      if(newV4 && !oldV4) {
        preMain()
        return
      }

      if(!newV5 && oldV5) {
        preMain()
        return
      }

    }, { immediate: true })

    setInterval(() => {
      preMain()
    }, MIN_5)

  }


  private static async main() {

    // 0. 避免频繁请求的阻断
    // 0.1 判断是否 25s 内已经请求过了
    const lms = this.lastFinishMainStamp
    if(time.isWithinMillis(lms, SEC_25)) return

    // 0.2 判断是否正在执行 main()
    if(this.isMaining) return
    this.isMaining = true

    // 1. 时间对齐
    if(!this.isTimeCalibrated) {
      const res1 = await this.timeCalibrate()
      if(!res1) {
        this.isMaining = false
        return
      }
    }
    
    // 2. 判断是否用户已登录，若未登录则不继续
    const hasLogged = localCache.hasLoginWithBackend()
    if(!hasLogged) {
      this.isMaining = false
      return
    }

    // 3. 等待 workspace 就位
    const res3 = await waitEnterIntoApp()

    // 4. 用户进入时间
    const hasEntered = await this.userEnter()
    if(hasEntered) {
      this.syncNum.value += 1
    }
    this.lastFinishMainStamp = time.getTime()
    this.isMaining = false
  }
  
  // 去对齐时间
  private static async timeCalibrate() {
    const t1 = time.getLocalTime()
    const res = await fetchHelloWorld()
    const t2 = time.getLocalTime()
    
    // console.log("fetchHelloWorld.......")
    // console.log(res)
    // console.log(" ")

    const clientStamp = Math.round((t2 + t1) / 2)
    const { code, data } = res

    if(code === "0000" && data) {
      const theStamp = data.stamp
      const diff = theStamp - clientStamp
      time.setDiff(diff)

      this.isTimeCalibrated = true
      return true
    }

    return false
  }

  // 去执行用户进入应用的流程
  private static async userEnter() {

    // 25 分钟内已经进入过了直接返回 true，视为已同后端交互过
    const lues = this.lastUserEnterStamp
    if(time.isWithinMillis(lues, MIN_25)) return true

    const res = await fetchUserEnter()
    const { code, data: d } = res
    if(code === "0000" && d) {
      this.lastUserEnterStamp = time.getTime()
      if(d.new_serial && d.new_token) {
        localCache.setPreference("serial", d.new_serial)
        localCache.setPreference("token", d.new_token)
        const wStore = useWorkspaceStore()
        wStore.updateSerialAndToken(d.new_serial, d.new_token)
      }
      const res2 = await afterGettingUserData(d, this.rr, {
        isRefresh: true 
      })

      if(res2) {
        liuConsole.sendMessage("User entered successfully")
      }

      return res2
    }

    // 检查是否要退出登录
    if(code === "E4003") {
      // 去退出登录
      logout(this.rr)
      liuConsole.sendMessage("User's token has expired")
      return false
    }

    return true
  }
  
  /**
   * 等待若干秒确认状态已经 ok (由 syncNum 来确认状态)
   * @param ms 超时阈值，单位毫秒
   * @returns 
   */
  private static checkEverythingOk(
    ms: number = 5000
  ): Promise<boolean> {
    const syncNum = this.syncNum
    if(syncNum.value > 0) return valTool.getPromise(true)

    let _resolve: BoolFunc
    const _wait = (a: BoolFunc) => {
      _resolve = a
    }

    let timeout: LiuTimeout
    let stop: WatchStopHandle

    stop = watch(syncNum, (newV) => {
      if(timeout) clearTimeout(timeout)
      stop?.()
      _resolve(true)
    })

    timeout = setTimeout(() => {
      stop?.()
      timeout = undefined
      _resolve(false)
    }, ms)

    return new Promise(_wait)
  }

  // manually getting latest user info
  static async getLatestUserInfo() {
    const isOk = await this.checkEverythingOk()
    if(!isOk) return

    // to fetch
    const res = await fetchLatestUser()
    const { code, data: d } = res
    if(code === "0000" && d) {
      const res2 = await afterGettingUserData(d, this.rr)
      if(res2) return d
    }

    // check if need to logout
    if(code === "E4003") {
      // to logout
      logout(this.rr)
    }

  }


  /** get UserLocalTable from DB directly */
  static async getUserFromDB() {
    const res = await getUser()
    return res
  }

  // syncNum.value >= 1 as soon as everything has been ok and
  // has fetched the latest user info
  static getSyncNum() {
    return readonly(this.syncNum)
  }

  static addSyncNumManually() {
    this.syncNum.value += 1
  }

  /** call it after just logging in */
  static justLogged() {
    this.syncNum.value += 1
    this.lastFinishMainStamp = time.getTime()
  }

  static toLogout() {
    this.syncNum.value = 0
    logout(this.rr)
  }
  

}

export { CloudEventBus }