import time from "~/utils/basic/time";
import valTool from "~/utils/basic/val-tool";
import { type LiuTimeout } from "~/utils/basic/type-tool";

const MAX_WAITING = 4 * time.SECONED

// listen to document loaded
// and close the splash screen
export function listenLoaded() {

  let hasClosed = false
  let maxCloseTimeout: LiuTimeout

  const _closeSplashScreen = async () => {
    if(hasClosed) return
    hasClosed = true

    const el = document.querySelector(".liu-splash-screen")
    if(!el) return

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

  const _calculateConsumingTime = async () => {
    const entries = performance.getEntriesByType("navigation")
    const len = entries.length
    if(len < 1) {
      _byebye()
      return
    }

    const lastEntry = entries[len - 1] as PerformanceNavigationTiming
    console.log(lastEntry)

    const stamp = Math.round(lastEntry.loadEventStart)

    if(stamp > 750) {
      _byebye()
      return
    }
    const duration = 900 - stamp

    console.log("等待毫秒数: ", duration)
    await valTool.waitMilli(duration)
    
    _byebye()
  }

  window.addEventListener("load", (e) => {
    console.log("listenLoaded load.......")
    _calculateConsumingTime()
  })
}