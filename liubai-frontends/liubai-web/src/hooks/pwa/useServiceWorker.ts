import { useRegisterSW } from 'virtual:pwa-register/vue';
import { watch } from 'vue';
import liuConsole from "~/utils/debug/liu-console";
import localCache from "~/utils/system/local-cache";
import time from "~/utils/basic/time";
import { type SimplePromise } from '~/utils/basic/type-tool';
import { useGlobalStateStore } from '../stores/useGlobalStateStore';
import cui from '~/components/custom-ui';

const SEC_10 = 10 * time.SECONED
const MIN_15 = 15 * time.MINUTE

let _updateSW: SimplePromise | undefined
let _swRegistration: ServiceWorkerRegistration | undefined

// Reference: 
// https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html#handling-edge-cases
const _checkSW = async (swUrl: string, r: ServiceWorkerRegistration) => {
  console.warn("see service-worker status: ")
  console.log("r.installing: ", r.installing)
  console.log("r.waiting: ", r.waiting)
  console.log("r.active: ", r.active)
  console.log(" ")

  if (r.installing || !navigator) return

  if ("connection" in navigator) {
    if (!navigator.onLine) return
  }

  const { lastCheckSWStamp } = localCache.getOnceData()
  if (lastCheckSWStamp) {
    const isWithin = time.isWithinMillis(lastCheckSWStamp, SEC_10)
    if (isWithin) {
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

  if (resp?.status === 200) {
    console.time("r.update")
    await r.update()
    console.timeEnd("r.update")
  }
  else {
    console.warn("fail to fetch the result from service worker:")
    console.log(resp)
    console.log(" ")
  }
}


export function initServiceWorker() {
  
  const onRegisteredSW = (
    swUrl: string, 
    r: ServiceWorkerRegistration | undefined,
  ) => {
    // the func will be called every time you open the page
    // as long as sw is registered successfully
    _swRegistration = r
    
    if(!r) return
    setTimeout(() => {
      _checkSW(swUrl, r)
    }, time.SECONED)
    setInterval(() => {
      _checkSW(swUrl, r)
    }, MIN_15)

    r.addEventListener("updatefound", (evt) => {
      console.warn("service-worker updatefound......")
      console.log(evt)
      const newWorker = r.installing
      if(!newWorker) return
      const state1 = newWorker.state
      console.log("newWorker.state: ", state1)
      
      newWorker.addEventListener("statechange", (evt) => {
        console.warn("newWorker statechange......")
        console.log(newWorker.state)
      })
    })
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

  window.addEventListener('beforeunload', (event) => {
    if(needRefresh.value) {
      console.log("needRefresh is true, so we get to update the sw")
      updateServiceWorker()
    }
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


export function getSWRegistration() {
  return _swRegistration
}

