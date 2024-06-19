import { onBeforeUnmount, onMounted, reactive, watch } from "vue";
import type { IbData } from "./types";
import liuApi from "~/utils/liu-api";
import cui from "~/components/custom-ui";
import localCache from "~/utils/system/local-cache";
import time from "~/utils/basic/time";
import { 
  type RouteAndLiuRouter, 
  useRouteAndLiuRouter,
} from "~/routes/liu-router";
import cfg from "~/config";
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { pwaInfo } from 'virtual:pwa-info'
import liuConsole from "~/utils/debug/liu-console";
import valTool from "~/utils/basic/val-tool";

const SEC_20 = 20 * time.SECONED
const MIN_15 = 15 * time.MINUTE

interface IbCtx {
  rr: RouteAndLiuRouter
  ibData: IbData
}

let deferredPrompt: Event | null

export function useIndexBoard() {
  const rr = useRouteAndLiuRouter()
  const ibData = reactive<IbData>({
    a2hs: false,
  })
  const ctx: IbCtx = {
    rr,
    ibData,
  }

  useServiceWorker(ctx)
  listenToA2HS(ibData)

  const onTapInstall = () => {
    toInstallA2HS(ctx)
  }

  const onTapCloseA2hsTip = () => {
    toCloseA2HS(ctx)
  }
  
  return {
    ibData,
    onTapInstall,
    onTapCloseA2hsTip,
  }
}


function useServiceWorker(
  ctx: IbCtx,
) {
  
  console.log("查看 PWA info: ", pwaInfo)
  if(pwaInfo) {
    const pwaStr = valTool.objToStr(pwaInfo)
    liuConsole.sendMessage(`PWA info: ${pwaStr}`)
  }


  // Reference: 
  // https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html#handling-edge-cases
  const _checkSW = async (swUrl: string, r: ServiceWorkerRegistration) => {
    if(r.installing || !navigator) return

    if("connection" in navigator) {
      if(!navigator.onLine) return
    }

    const resp = await fetch(swUrl, {
      cache: 'no-store',
      headers: {
        'cache': 'no-store',
        'cache-control': 'no-cache',
      },
    })

    console.log("查看 service worker fetch 的结果: ")
    console.log(resp)
    console.log(" ")

    if(resp?.status === 200) {
      await r.update()
    }
  }

  const {
    offlineReady,
    needRefresh,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      console.log(`Service Worker at: ${swUrl}`)
      console.log(r)
      liuConsole.sendMessage(`Service Worker registered at: ${swUrl}`)
      if(!r) return
      setTimeout(() => {
        _checkSW(swUrl, r)
      }, time.SECONED)
      setInterval(() => {
        _checkSW(swUrl, r)
      }, SEC_20)
    },
    onRegisterError(err) {
      console.warn("onRegisterError err:")
      console.log(err)
      liuConsole.addBreadcrumb({ 
        category: "pwa.sw",
        message: "onRegisterError",
        level: "error",
      })
      liuConsole.sendException(err)
    }
  })

  watch([offlineReady, needRefresh], ([newV1, newV2]) => {
    console.log("offlineReady: ", newV1)
    console.log("needRefresh: ", newV2)
    console.log(" ")
  })
}


async function toCloseA2HS(
  ctx: IbCtx,
) {
  if(liuApi.canIUse.isArcBrowser()) {
    localCache.setOnceData("a2hs_last_cancel_stamp", time.getTime())
    ctx.ibData.a2hs = false
    return
  }

  const res1 = await cui.showModal({
    title_key: "a2hs.tip_1",
    content_key: "a2hs.tip_2",
    cancel_key: "a2hs.tip_cancel",
    confirm_key: "a2hs.tip_confirm",
    tip_key: "common.never_prompt",
  })

  if(res1.tipToggle) {
    localCache.setOnceData("a2hs_never_prompt", true)
  }
  
  if(res1.cancel) {
    localCache.setOnceData("a2hs_last_cancel_stamp", time.getTime())
    ctx.ibData.a2hs = false
  }

  if(res1.confirm) {
    toInstallA2HS(ctx)
  }
}

async function toInstallA2HS(
  ctx: IbCtx,
) {

  if(liuApi.canIUse.isArcBrowser()) {
    cannotSupportA2HS(ctx)
    return
  }

  const cha = liuApi.getCharacteristic()
  if(cha.isSafari) {
    ctx.rr.router.push({ name: "a2hs" })
    return
  }

  if(!deferredPrompt) {
    ctx.ibData.a2hs = false
    return
  }

  console.log("toInstallA2HS......")
  console.log(deferredPrompt)
  console.log(" ")

  //@ts-ignore
  deferredPrompt.prompt()

  const installStamp = time.getTime()

  //@ts-ignore
  const userChoice = await deferredPrompt.userChoice

  console.log("User Choice::")
  console.log(userChoice)
  const outcome = userChoice?.outcome

  if(outcome === "accepted" || outcome === "installed") {
    console.log('User accepted the A2HS prompt or installed it!')
    deferredPrompt = null
    ctx.ibData.a2hs = false
    return
  }

  console.log('User dismissed the A2HS prompt')

  if(time.isWithinMillis(installStamp, cfg.frame_duration_2)) {
    cannotSupportA2HS(ctx)
  }

}

function cannotSupportA2HS(
  ctx: IbCtx,
) {
  localCache.setOnceData("a2hs_never_prompt", true)
  cui.showModal({
    title_key: "a2hs.fail_to_add",
    content_key: "a2hs.fail_to_add_tip",
    showCancel: false,
  })
  ctx.ibData.a2hs = false
}



function listenToA2HS(
  ibData: IbData,
) {
  const cha = liuApi.getCharacteristic()
  if(cha.isInWebView) {
    return
  }
  if(liuApi.canIUse.isArcBrowser()) {
    return
  }

  const onceData = localCache.getOnceData()
  if(onceData.a2hs_never_prompt) {
    return
  }

  const lastCancelStamp = onceData.a2hs_last_cancel_stamp ?? 1
  const isWithin = time.isWithinMillis(lastCancelStamp, time.DAY)
  if(isWithin) {
    return
  }

  const _beforeInstallPrompt = (e: Event) => {
    if(liuApi.canIUse.isArcBrowser()) return
    e.preventDefault()
    deferredPrompt = e
    ibData.a2hs = true
  }

  const _appInstalled = () => {
    deferredPrompt = null
    ibData.a2hs = false
  }

  onMounted(() => {
    window.addEventListener("beforeinstallprompt", _beforeInstallPrompt)
    window.addEventListener("appinstalled", _appInstalled)

    if(cha.isSafari) {
      handleA2HSForSafari(ibData)
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener("beforeinstallprompt", _beforeInstallPrompt)
    window.removeEventListener("appinstalled", _appInstalled)
  })
  
}


function handleA2HSForSafari(
  ibData: IbData,
) {
  //@ts-expect-error Property only exists on Safari
  const standalone = window.navigator.standalone
  if(typeof standalone !== "boolean") return
  
  ibData.a2hs = !standalone
}


