import { onMounted, onBeforeUnmount, ref, type Ref } from "vue";
import cui from "~/components/custom-ui";
import cfg from "~/config";
import { RouteAndLiuRouter, useRouteAndLiuRouter } from "~/routes/liu-router";
import time from "~/utils/basic/time";
import liuApi from "~/utils/liu-api";
import localCache from "~/utils/system/local-cache";

export function useShowAddToHomeScreen() {
  const showButtonForA2HS = ref(false)
  let deferredPrompt: Event | null = null

  const cha = liuApi.getCharacteristic()
  if(cha.isInWebView || cha.isFirefox) {
    return {}
  }
  if(liuApi.canIUse.isArcBrowser()) {
    return {}
  }

  const isStanda = liuApi.canIUse.isRunningStandalone()
  if(isStanda) {
    return {}
  }


  const rr = useRouteAndLiuRouter()

  const _beforeInstallPrompt = (e: Event) => {
    e.preventDefault()
    if(liuApi.canIUse.isArcBrowser()) return
    deferredPrompt = e
    showButtonForA2HS.value = true
  }

  const _appInstalled = () => {
    deferredPrompt = null
    showButtonForA2HS.value = false
  }

  const _testRelatedApps = async () => {
    await liuApi.canIUse.hasInstalledPWA()
  }

  onMounted(() => {
    // console.warn("pretend to show a2hs button")
    // showButtonForA2HS.value = true

    window.addEventListener("beforeinstallprompt", _beforeInstallPrompt)
    window.addEventListener("appinstalled", _appInstalled)

    if(cha.isSafari) {
      handleA2HSForSafari(showButtonForA2HS)
    }

    _testRelatedApps()
  })

  onBeforeUnmount(() => {
    window.removeEventListener("beforeinstallprompt", _beforeInstallPrompt)
    window.removeEventListener("appinstalled", _appInstalled)
  })

  const toA2HS = () => {
    whenA2HS(showButtonForA2HS, deferredPrompt, rr)
  }

  return {
    showButtonForA2HS,
    toA2HS,
  }
}

async function whenA2HS(
  showButtonForA2HS: Ref<boolean>,
  deferredPrompt: Event | null,
  rr: RouteAndLiuRouter,
) {

  if(liuApi.canIUse.isArcBrowser()) {
    cannotSupportA2HS()
    showButtonForA2HS.value = false
    return
  }

  const cha = liuApi.getCharacteristic()
  if(cha.isSafari) {
    rr.router.push({ name: "a2hs" })
    return
  }

  const dp = deferredPrompt
  if(!dp) {
    showButtonForA2HS.value = false
    return
  }

  //@ts-ignore
  dp.prompt()

  const installStamp = time.getTime()

  //@ts-ignore
  const userChoice = await dp.userChoice
  const outcome = userChoice?.outcome


  if(outcome === "accepted" || outcome === "installed") {
    showButtonForA2HS.value = false
    return
  }

  if(time.isWithinMillis(installStamp, cfg.frame_duration_2)) {
    cannotSupportA2HS()
    showButtonForA2HS.value = false
  }
}


function handleA2HSForSafari(
  showButtonForA2HS: Ref<boolean>,
) {
  const res = liuApi.canIUse.canAddToHomeScreenInSafari()
  if(!res) return
  showButtonForA2HS.value = true
}

function cannotSupportA2HS() {
  localCache.setOnceData("a2hs_never_prompt", true)
  cui.showModal({
    title_key: "a2hs.fail_to_add",
    content_key: "a2hs.fail_to_add_tip",
    showCancel: false,
  })
}