import { useRegisterSW } from 'virtual:pwa-register/vue';
import { watch } from 'vue';
import liuConsole from "~/utils/debug/liu-console";
import localCache from "~/utils/system/local-cache";
import time from "~/utils/basic/time";
import { type SimplePromise } from '~/utils/basic/type-tool';
import { useGlobalStateStore } from '../stores/useGlobalStateStore';
import cui from '~/components/custom-ui';

const MIN_1 = time.MINUTE
const MIN_15 = 15 * time.MINUTE

let _updateSW: SimplePromise | undefined

export function initServiceWorker() {

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

    if(resp?.status === 200) {
      console.time("r.update")
      await r.update()
      console.timeEnd("r.update")
      console.log("service worker registration updated!")
    }
    console.log(" ")
  }

  const onRegisteredSW = (
    swUrl: string, 
    r: ServiceWorkerRegistration | undefined,
  ) => {
    // the func will be called every time you open the page
    // as long as sw is registered successfully
    
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
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW,
    onRegisterError,
  })

  _updateSW = updateServiceWorker

  const gStore = useGlobalStateStore()

  watch([offlineReady, needRefresh], ([newV1, newV2]) => {
    console.log("offlineReady: ", newV1)
    console.log("needRefresh: ", newV2)
    console.log(" ")
    gStore.setNewVersion(newV2)
  })
}

export async function toUpdateSW(
  loading = false
) {
  if(!_updateSW) return

  if(loading) {
    cui.showLoading({ title_key: "common.updating" })
    setTimeout(() => {
      cui.hideLoading()
    }, 3000)
  }
  
  localCache.setOnceData("lastInstallNewVersion", time.getTime())
  await _updateSW()
}

