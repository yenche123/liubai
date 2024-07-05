import time from "~/utils/basic/time";
import valTool from "~/utils/basic/val-tool";
import { type LiuTimeout } from "~/utils/basic/type-tool";
import { onMounted } from "vue";
import { useGlobalStateStore } from "../stores/useGlobalStateStore";
import liuUtil from "~/utils/liu-util";

const MAX_WAITING = 3 * time.SECONED

// listen to document loaded
// and close the splash screen
export function listenLoaded() {

  const gs = useGlobalStateStore()
  let hasClosed = false
  let maxCloseTimeout: LiuTimeout

  const _closeSplashScreen = async () => {
    if(hasClosed) return
    hasClosed = true
    gs.$patch({ windowLoaded: true })

    const el = document.querySelector(".liu-splash-screen")
    if(!el) return

    await liuUtil.waitAFrame()
    el.classList.add("liuss-hidden")
    await valTool.waitMilli(300)
    el.remove()
  }

  const _clearTimeout = () => {
    if(maxCloseTimeout) {
      clearTimeout(maxCloseTimeout)
    }
    maxCloseTimeout = undefined
  }

  const _byebye = () => {
    _clearTimeout()
    _closeSplashScreen()
  }

  maxCloseTimeout = setTimeout(() => {
    console.log("触发最大等待时间......")
    maxCloseTimeout = undefined
    _closeSplashScreen()
  }, MAX_WAITING)

  const _getLoadEventStart = () => {
    const entries = performance.getEntriesByType("navigation")
    const len = entries.length
    if(len < 1) return
    const lastEntry = entries[len - 1] as PerformanceNavigationTiming
    const stamp = Math.round(lastEntry.loadEventStart)
    return stamp
  }

  const _calculateConsumingTime = async () => {
    let stamp = _getLoadEventStart()
    if(!stamp) return
    const now = Math.round(performance.now())
    if(now > stamp) {
      stamp = now
    }

    if(stamp > 750) {
      _byebye()
      return
    }
    const duration = 900 - stamp
    await valTool.waitMilli(duration)
    _byebye()
  }

  const stamp1 = _getLoadEventStart()

  // console.log("listenLoaded setup: ", performance.now())
  // console.log("load event start at: ", stamp1)
  // console.log(" ")

  if(stamp1) {
    onMounted(() => {
      // console.log("listenLoaded onMounted.......")
      // console.log(performance.now())
      // console.log(" ")
      _calculateConsumingTime()
    })
  }
  else {
    window.addEventListener("load", (e) => {
      // console.log("listenLoaded load.......")
      // console.log(performance.now())
      // console.log(" ")
      _calculateConsumingTime()
    })
  }

}