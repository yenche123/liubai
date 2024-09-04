import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import type { BoolFunc } from "~/utils/basic/type-tool";

let waitPromise: Promise<boolean> | undefined
export function waitWindowLoaded() {
  if(waitPromise) return waitPromise
  const _wait = (a: BoolFunc) => {
    const gStore = useGlobalStateStore()
    if(gStore.windowLoaded) {
      a(true)
      return
    }
    const { windowLoaded } = storeToRefs(gStore)
    const _stop = watch(windowLoaded, async (newV) => {
      if(!newV) return
      a(true)
      _stop()
    }, { immediate: true })
  }
  waitPromise = new Promise(_wait)
  return waitPromise
}

let waitJSWxBridgePromise: Promise<boolean> | undefined
export function waitWxJSBridge() {
  if(waitJSWxBridgePromise) return waitJSWxBridgePromise
  const _wait = (a: BoolFunc) => {
    const gStore = useGlobalStateStore()
    if(gStore.wxJSBridgeReady) {
      a(true)
      return
    }

    const { wxJSBridgeReady } = storeToRefs(gStore)
    const _stop = watch(wxJSBridgeReady, (newV) => {
      if(!newV) return
      a(true)
      _stop()
    }, { immediate: true })
  }
  waitJSWxBridgePromise = new Promise(_wait)
  return waitJSWxBridgePromise
}