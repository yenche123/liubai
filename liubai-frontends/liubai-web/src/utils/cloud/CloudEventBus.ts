import { ref, reactive, watch } from "vue"
import { 
  useRouteAndLiuRouter,
  type RouteAndLiuRouter
} from "~/routes/liu-router"
import { useNetwork, useDocumentVisibility, useThrottleFn } from "~/hooks/useVueUse";
import { fetchHelloWorld, fetchUserEnter } from "./tools/requests";
import time from "../basic/time";
import localCache from "../system/local-cache";
import liuEnv from "../liu-env";

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
      if(newV2 === "hidden") return
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
    if(diff1 < 10 * time.SECONED) return

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

    // 3. 用户进入事件
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
    if(diff < 30 * time.MINUTE) return true

    const res = await fetchUserEnter()

    
    // console.log("fetchUserEnter.......")
    // console.log(res)
    // console.log(" ")


    const { code, data: d } = res
    if(code === "0000" && d) {
      this.lastUserEnterStamp = time.getTime()
      if(d.new_serial && d.new_token) {
        localCache.setPreference("serial", d.new_serial)
        localCache.setPreference("token", d.new_token)
      }
    }

    // 检查是否要退出登录
    if(code === "E4003") {
      // 去退出登录

      return false
    }

    return true
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