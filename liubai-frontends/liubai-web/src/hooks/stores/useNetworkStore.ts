import { defineStore } from "pinia"
import { reactive, readonly, ref, watch } from "vue"
import { useNetwork } from "../useVueUse"

/**
 * 返回一个 0～3 的数值 level，分别表示
 *  0: 无网络
 *  1: 网络差
 *  2: 网络中等
 *  3: 网络良好
 */

export const useNetworkStore = defineStore("network", () => {
  const level = ref(2)

  const tmp = useNetwork()
  const networkState = reactive(tmp)
  watch(networkState, (newV) => {
    const {
      isOnline,
      isSupported,
      effectiveType,
      rtt,
      downlink,
    } = newV

    console.log("isOnline: ", isOnline)
    console.log("effectiveType: ", effectiveType)
    console.log("rtt: ", rtt)
    console.log("downlink: ", downlink)
    console.log(" ")

    if(!isSupported) return
    if(!isOnline) {
      level.value = 0
      return
    }
    
    if(effectiveType === "slow-2g" || effectiveType === "2g") {
      level.value = 1
      return
    }
    
    if(typeof rtt === "number") {
      if(rtt <= 400) {
        level.value = 3
        return
      }
      if(rtt <= 1200) {
        level.value = 2
        return
      }
      if(rtt > 2500) {
        level.value = 1
        return
      }
    }

    if(downlink) {
      if(downlink <= 0.5) {
        level.value = 1
        return
      }
      if(downlink <= 1.22) {
        level.value = 2
        return
      }
    }

    level.value = 3
  }, { immediate: true })

  return {
    level: readonly(level),
  }
})