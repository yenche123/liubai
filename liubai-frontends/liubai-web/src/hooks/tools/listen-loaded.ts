import time from "~/utils/basic/time";
import valTool from "~/utils/basic/val-tool";
import { type LiuTimeout } from "~/utils/basic/type-tool";
import { onMounted } from "vue";
import { useGlobalStateStore } from "../stores/useGlobalStateStore";

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
      console.log("no navigation entries")
      return
    }

    const lastEntry = entries[len - 1] as PerformanceNavigationTiming
    console.log(lastEntry)
    let stamp = Math.round(lastEntry.loadEventStart)
    console.log("stamp: ", stamp)

    if(!stamp) {
      console.log(" ")
      return
    }

    const now = Math.round(performance.now())
    console.log("now: ", now)
    if(now > stamp) {
      stamp = now
    }

    if(stamp > 750) {
      _byebye()
      return
    }
    const duration = 900 - stamp

    console.log("等待毫秒数: ", duration)
    console.log(" ")
    await valTool.waitMilli(duration)
    
    _byebye()
  }

  window.addEventListener("load", (e) => {
    console.log("listenLoaded load.......")
    _calculateConsumingTime()
  })

  onMounted(() => {
    console.log("listenLoaded onMounted.......")
    _calculateConsumingTime()
  })
  
}