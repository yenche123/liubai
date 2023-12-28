// 当用户联网时 或 进入当前分页时，去调用 user-enter
// 若用户还未登录，则在 toUserEnter 内忽略调用
import { ref, watch, reactive } from "vue";
import { defineStore } from "pinia";
import { useNetwork, useThrottleFn } from "../../useVueUse"
import time from "~/utils/basic/time";
import liuConsole from "~/utils/debug/liu-console"
import localCache from "~/utils/system/local-cache";

export const useUserEnterStore = defineStore("userEnter", () => {

  const lastUserEnterStamp = ref<number | null>(null)
  const setLatestUserEnterStamp = () => {
    lastUserEnterStamp.value = time.getTime()
  }

  const toUserEnter = useThrottleFn(async () => {

    // 1. 检查有没有登录态
    const { local_id, serial, token } = localCache.getPreference()
    if(!local_id || !serial || !token) return

    // 2. 去调用 user-enter
    console.log("去调用 user-enter............")

    
  }, 3000)

  const networkState = reactive(useNetwork())
  watch(networkState, (newV) => {
    liuConsole.showNowStamp()
    const { isOnline, isSupported } = newV
    
    if(!isOnline) return
    const lues = lastUserEnterStamp.value
    const diffS = time.getTime() - (lues ?? 0)
    // 若超过 30 分钟未触发过，再去触发
    if(diffS > 30 * time.MINUTE) {
      toUserEnter()
    }
  })
  liuConsole.showNowStamp()
  toUserEnter()

  return {
    lastUserEnterStamp,
    setLatestUserEnterStamp,
  }
})

