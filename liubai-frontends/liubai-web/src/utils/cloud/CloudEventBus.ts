import { ref, reactive, watch, type WatchStopHandle } from "vue"
import { 
  useRouteAndLiuRouter,
  type RouteAndLiuRouter
} from "~/routes/liu-router"
import { 
  useNetwork, 
  useDocumentVisibility, 
  useThrottleFn,
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
import { afterGettingUserData } from "./tools/after-fetch";
import type { BoolFunc, LiuTimeout } from "~/utils/basic/type-tool"
import valTool from "../basic/val-tool";
import { waitEnterIntoApp } from "~/hooks/useEnterIntoApp";

const SEC_10 = 10 * time.SECONED
const MIN_30 = 30 * time.MINUTE

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


    // 监听网络、窗口是否可视等变化
    const visibility = useDocumentVisibility()
    const networkState0 = useNetwork()
    const networkState = reactive(networkState0)
    watch([networkState, visibility], (
      [newV1, newV2],
      [oldV1, oldV2]
    ) => {

      // 当前分页被隐藏，并且非刚启动时（刚启动时，oldV2 为 undefined）
      if(newV2 === "hidden" && oldV2) return
      if(!newV1.isOnline) return

      if(!_this.isTimeCalibrated) {
        preMain()
        return
      }

      if(newV1.isOnline && !newV1?.isOnline) {
        preMain()
        return
      }

      if(newV2 === "visible" && oldV2 === "hidden") {
        preMain()
        return
      }

    }, { immediate: true })

  }


  private static async main() {

    // 0. 避免频繁请求的阻断
    // 0.1 判断是否 10s 内已经请求过了
    const lms = this.lastFinishMainStamp
    const diff1 = time.getTime() - lms
    if(diff1 < SEC_10) return

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
    const t1 = time.getTime()
    const res = await fetchHelloWorld()
    const t2 = time.getTime()
    
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

    // 30 分钟内已经进入过了直接返回 true，视为已同后端交互过
    const lues = this.lastUserEnterStamp
    const diff = time.getTime() - lues
    if(diff < MIN_30) return true

    const res = await fetchUserEnter()
    const { code, data: d } = res
    if(code === "0000" && d) {
      this.lastUserEnterStamp = time.getTime()
      if(d.new_serial && d.new_token) {
        localCache.setPreference("serial", d.new_serial)
        localCache.setPreference("token", d.new_token)
      }
      await afterGettingUserData(d, this.rr, { isRefresh: true })
    }

    // 检查是否要退出登录
    if(code === "E4003") {
      // 去退出登录
      logout(this.rr)
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
      await afterGettingUserData(d, this.rr)
      return d
    }

    // check if need to logout
    if(code === "E4003") {
      // to logout
      logout(this.rr)
    }

  }



  static getSyncNum() {
    return this.syncNum
  }

  static justLogged() {
    this.syncNum.value += 1
    this.lastFinishMainStamp = time.getTime()
  }
  

}

export { CloudEventBus }