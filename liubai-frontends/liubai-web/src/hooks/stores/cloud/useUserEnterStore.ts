// 当用户联网时 或 进入当前分页时，去调用 user-enter
// 若用户还未登录，则在 toUserEnter 内忽略调用
// 若用户刚登录完成，也无需调用，因为 user-login 已完成了这方面的工作
import { ref, watch, reactive } from "vue";
import { defineStore } from "pinia";
import { useNetwork, useThrottleFn } from "../../useVueUse";
import time from "~/utils/basic/time";
import localCache from "~/utils/system/local-cache";
import { fetchUserEnter } from "./tools/requests"
import liuUtil from "~/utils/liu-util";

export const useUserEnterStore = defineStore("userEnter", () => {

  const lastUserEnterStamp = ref<number | null>(null)
  const setLatestUserEnterStamp = () => {
    lastUserEnterStamp.value = time.getTime()
  }

  const toUserEnter = useThrottleFn(async () => {

    // 1. 检查有没有登录态
    const res0 = localCache.hasLoginWithBackend()
    if(!res0) return

    // 2. 去调用 user-enter
    const res1 = await fetchUserEnter()

    if(res1.code === "0000") {
      setLatestUserEnterStamp()
    }
    
  }, 5000)

  const networkState1 = useNetwork()
  const networkState2 = reactive(networkState1)
  watch(networkState2, (newV) => {
    const { 
      isOnline, 
    } = newV
    const newV2 = liuUtil.unToRefs(newV)
    console.log(newV2)
    console.log(" ")

    if(!isOnline) return
    const lues = lastUserEnterStamp.value
    const diffS = time.getTime() - (lues ?? 0)
    // 若超过 30 分钟未触发过，再去触发
    if(diffS > 30 * time.MINUTE) {
      toUserEnter()
    }
  })

  return {
    lastUserEnterStamp,
    setLatestUserEnterStamp,
  }
})

