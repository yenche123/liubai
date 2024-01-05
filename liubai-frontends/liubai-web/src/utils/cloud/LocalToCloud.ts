import { storeToRefs } from "pinia";
import { useUserEnterStore } from "~/hooks/stores/cloud/useUserEnterStore";
import { watch, reactive } from "vue";
import { useNetwork, useThrottleFn } from "~/hooks/useVueUse";
import localCache from "../system/local-cache";

class LocalToCloud {

  static isOnline: boolean | undefined
  static lastUserEnterStamp: number | null
  static lastTriggerStamp: number | undefined

  static init() {
    let _this = this
    const ueStore = useUserEnterStore()
    const { lastUserEnterStamp } = storeToRefs(ueStore)

    const networkState1 = useNetwork()
    const networkState2 = reactive(networkState1)

    watch([lastUserEnterStamp, networkState2], ([newV1, newV2]) => {
      _this.isOnline = newV2.isOnline
      _this.lastUserEnterStamp = newV1
    })
  }

  static preTrigger() {
    let { isOnline, lastUserEnterStamp, lastTriggerStamp } = this
    if(!isOnline) return
    if(!lastUserEnterStamp) return

    const hasLogged = localCache.hasLoginWithBackend()
    if(!hasLogged) return

    

  }


}

export {
  LocalToCloud
}