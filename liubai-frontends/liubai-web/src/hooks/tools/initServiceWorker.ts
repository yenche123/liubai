import { useRegisterSW } from 'virtual:pwa-register/vue';
import { pwaInfo } from 'virtual:pwa-info';
import { watch } from 'vue';
import liuConsole from "~/utils/debug/liu-console";
import localCache from "~/utils/system/local-cache";
import time from "~/utils/basic/time";
import valTool from '~/utils/basic/val-tool';

const SEC_20 = 20 * time.SECONED
const MIN_1 = time.MINUTE
const MIN_15 = 15 * time.MINUTE

export function initServiceWorker() {
  console.log("PWA info: ", pwaInfo)
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

    const { lastCheckSWStamp } = localCache.getOnceData()
    if(lastCheckSWStamp) {
      const isWithin = time.isWithinMillis(lastCheckSWStamp, MIN_1)
      if(isWithin) {
        console.log("too frequent to check out service worker")
        return
      }
    }
    localCache.setOnceData("lastCheckSWStamp", time.getTime())

    const resp = await fetch(swUrl, {
      cache: 'no-store',
      headers: {
        'cache': 'no-store',
        'cache-control': 'no-cache',
      },
    })

    console.log("check out the result from service worker fetch: ")
    console.log(resp)
    console.log(" ")

    if(resp?.status === 200) {
      await r.update()
    }
  }

  const onRegisteredSW = (
    swUrl: string, 
    r: ServiceWorkerRegistration | undefined,
  ) => {
    liuConsole.sendMessage(`Service Worker registered at: ${swUrl}`)
    if(!r) return
    setTimeout(() => {
      _checkSW(swUrl, r)
    }, time.SECONED)
    setInterval(() => {
      _checkSW(swUrl, r)
    }, MIN_15)
  }

  const onRegisterError = (err: any) => {
    console.warn("onRegisterError err:")
    console.log(err)
    liuConsole.addBreadcrumb({ 
      category: "pwa.sw",
      message: "onRegisterError",
      level: "error",
    })
    liuConsole.sendException(err)
  }

  const {
    offlineReady,
    needRefresh,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW,
    onRegisterError,
  })

  watch([offlineReady, needRefresh], ([newV1, newV2]) => {
    console.log("offlineReady: ", newV1)
    console.log("needRefresh: ", newV2)
    console.log(" ")
  })

}