import { reactive, watch } from "vue";
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
import { toUpdateSW } from "~/hooks/pwa/useServiceWorker";
import { useIdle } from "~/hooks/useVueUse";
import { useShowAddToHomeScreen } from "~/hooks/pwa/useA2HS";
import { type SimpleFunc } from "~/utils/basic/type-tool";

const SEC_90 = 90 * time.SECONED

interface IbCtx {
  rr: RouteAndLiuRouter
  ibData: IbData
  hasEverTapInstall: boolean
}

export function useIndexBoard() {
  const rr = useRouteAndLiuRouter()
  const ibData = reactive<IbData>({
    a2hs: false,
    newVersion: false,
  })
  const ctx: IbCtx = {
    rr,
    ibData,
    hasEverTapInstall: false
  }
  listenToNewVersion(ctx)
  const { toA2HS } = listenToA2HS(ibData)

  const onTapInstall = () => {
    ctx.hasEverTapInstall = true
    toA2HS?.()
  }

  return {
    ibData,
    onTapInstall,
    onTapCloseA2hsTip: () => toCloseA2HS(ctx, toA2HS),
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
  toA2HS?: SimpleFunc,
) {

  const _close = () => {
    localCache.setOnceData("a2hs_last_cancel_stamp", time.getTime())
    ctx.ibData.a2hs = false
  }

  if(liuApi.canIUse.isArcBrowser()) {
    _close()
    return
  }

  if(liuApi.canIUse.isRunningStandalone()) {
    _close()
    return
  }

  const cha = liuApi.getCharacteristic()
  if(cha.isSafari && ctx.hasEverTapInstall) {
    _close()
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
    _close()
  }

  if(res1.confirm) {
    toA2HS?.()
  }
}

let hasListenedToIdle = false
function listenToIdleAndUpdate(
  ctx: IbCtx,
) {
  if(hasListenedToIdle) return
  hasListenedToIdle = true
  
  const { idle } = useIdle(SEC_90)
  watch(idle, (newV) => {
    if(!newV) return

    const { 
      vlink, 
      vfile, 
    } = ctx.rr.route.query

    if(vlink || vfile) {
      console.log("cancel update sw because vlink or vfile exists")
      return
    }

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
      lastInstallNewVersion,
      lastCancelNewVersion,
      lastConfirmNewVersion,
    } = localCache.getOnceData()
    const nv = cfg.newVersion

    if(lastInstallNewVersion) {
      const day0 = nv.install_min_duration
      const duration0 = day0 * time.DAY
      const within0 = time.isWithinMillis(lastInstallNewVersion, duration0)
      if(within0) {
        listenToIdleAndUpdate(ctx)
        return
      }
    }

    if(lastCancelNewVersion) {
      const day1 = nv.cancel_min_duration
      const duration1 = day1 * time.DAY
      const within1 = time.isWithinMillis(lastCancelNewVersion, duration1)
      if(within1) {
        listenToIdleAndUpdate(ctx)
        return
      }
    }

    if(lastConfirmNewVersion) {
      const day2 = nv.confirm_min_duration
      const duration2 = day2 * time.DAY
      const within2 = time.isWithinMillis(lastConfirmNewVersion, duration2)
      if(within2) {
        listenToIdleAndUpdate(ctx)
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

  const onceData = localCache.getOnceData()
  if(onceData.a2hs_never_prompt) {
    return {}
  }

  const lastCancelStamp = onceData.a2hs_last_cancel_stamp ?? 1
  const isWithin = time.isWithinMillis(lastCancelStamp, time.DAY)
  if(isWithin) {
    return {}
  }

  const {
    showButtonForA2HS,
    toA2HS,
  } = useShowAddToHomeScreen()
  if(!showButtonForA2HS) return {}

  watch(showButtonForA2HS, (newV) => {
    if(newV) {
      if(!ibData.newVersion) {
        ibData.a2hs = true
      }
    }
    else {
      ibData.a2hs = false
    }
  })

  return { toA2HS }
}
