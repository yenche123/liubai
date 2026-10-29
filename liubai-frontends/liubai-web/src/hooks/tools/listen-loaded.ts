import time from "~/utils/basic/time";
import valTool from "~/utils/basic/val-tool";
import type { LiuTimeout } from "~/utils/basic/type-tool";
import { onMounted } from "vue";
import { useGlobalStateStore } from "../stores/useGlobalStateStore";
import liuUtil from "~/utils/liu-util";
import liuApi from "~/utils/liu-api";

const MAX_WAITING = 3 * time.SECOND

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
    await valTool.waitMilli(120)
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

  onMounted(() => {
    _byebye()
  })

}


// listen to wx jsbridge ready
export function listenWxJSBridgeReady() {
  const gs = useGlobalStateStore()

  const _onBridgeReady = () => {
    gs.$patch({ wxJSBridgeReady: true })
  }
  
  if(typeof WeixinJSBridge === "undefined") {
    if (document.addEventListener) {
      document.addEventListener('WeixinJSBridgeReady', _onBridgeReady, false);
    }
  }
  else {
    _onBridgeReady()
  }
}