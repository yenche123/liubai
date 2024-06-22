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
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { storeToRefs } from "pinia";
import { toUpdateSW } from "~/hooks/tools/initServiceWorker";
import { useIdle } from "~/hooks/useVueUse"

const SEC_90 = 90 * time.SECONED

interface IbCtx {
  rr: RouteAndLiuRouter
  ibData: IbData
}

let deferredPrompt: Event | null

export function useIndexBoard() {
  const rr = useRouteAndLiuRouter()
  const ibData = reactive<IbData>({
    a2hs: false,
    newVersion: false,
  })
  const ctx: IbCtx = {
    rr,
    ibData,
  }
  listenToNewVersion(ctx)
  listenToA2HS(ibData)

  return {
    ibData,
    onTapInstall: () => toInstallA2HS(ctx),
    onTapCloseA2hsTip: () => toCloseA2HS(ctx),
    onConfirmNewVersion: () => toConfirmNewVersion(ctx),
    onCancelNewVersion: () => toCancelNewVersion(ctx),
  }
}


async function toConfirmNewVersion(
  ctx: IbCtx,
) {
  ctx.ibData.newVersion = false
  localCache.setOnceData("lastConfirmNewVersion", time.getTime())
  await toUpdateSW()
}

function toCancelNewVersion(
  ctx: IbCtx,
) {
  ctx.ibData.newVersion = false
  localCache.setOnceData("lastCancelNewVersion", time.getTime())
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

let hasListenedToIdle = false
function listenToIdleAndUpdate() {
  if(hasListenedToIdle) return
  hasListenedToIdle = true
  
  const { idle } = useIdle(SEC_90)
  watch(idle, (newV) => {
    if(!newV) return
    console.warn("the tab has been idle for 90s")
    console.log("let's update sw!!!")
    toUpdateSW()
  })
}

function listenToNewVersion(
  ctx: IbCtx,
) {
  const gStore = useGlobalStateStore()
  const { hasNewVersion } = storeToRefs(gStore)

  const _checkIfPrompt = () => {
    const { a2hs, newVersion } = ctx.ibData
    if(a2hs) {
      console.warn("a2hs has already existed")
      return
    }

    if(newVersion) {
      console.warn("newVersion has already existed")
      return
    }

    const {
      lastCancelNewVersion,
      lastConfirmNewVersion,
    } = localCache.getOnceData()

    if(lastCancelNewVersion) {
      const day1 = cfg.newVersion.cancel_min_duration
      const duration1 = day1 * time.DAY
      const within1 = time.isWithinMillis(lastCancelNewVersion, duration1)
      if(within1) {
        listenToIdleAndUpdate()
        return
      }
    }

    if(lastConfirmNewVersion) {
      const day2 = cfg.newVersion.confirm_min_duration
      const duration2 = day2 * time.DAY
      const within2 = time.isWithinMillis(lastConfirmNewVersion, duration2)
      if(within2) {
        listenToIdleAndUpdate()
        return
      }
    }
    
    ctx.ibData.newVersion = true
  }

  watch(hasNewVersion, (newV) => {
    if(!newV) return
    console.log("发现新版本.................")
    _checkIfPrompt()
  })
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
    e.preventDefault()
    if(liuApi.canIUse.isArcBrowser()) return
    if(ibData.newVersion) return
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
  if(ibData.newVersion) return
  ibData.a2hs = !standalone
}


