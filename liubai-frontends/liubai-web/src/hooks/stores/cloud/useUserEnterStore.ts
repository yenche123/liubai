// 当用户联网时 或 进入当前分页时，去调用 user-enter
// 若用户还未登录，则在 toUserEnter 内忽略调用
import { ref, watch, reactive } from "vue";
import { defineStore } from "pinia";
import { useNetwork, useThrottleFn } from "../../useVueUse"
import time from "~/utils/basic/time";
import liuConsole from "~/utils/debug/liu-console"

export const useUserEnterStore = defineStore("userEnter", () => {

  console.log("init useUserEnterStore.......")


  const lastUserEnterStamp = ref<number | null>(null)

  const setLatestUserEnterStamp = () => {
    lastUserEnterStamp.value = time.getTime()
  }

  const toUserEnter = useThrottleFn(() => {
    console.log("toUserEnter........... 3s 内只触发一次")
  }, 3000)

  const networkState = reactive(useNetwork())
  watch(networkState, (newV) => {
    liuConsole.showNowStamp()
    console.log("看一下 networkState.........")
    console.log(newV)
    console.log(" ")
    const { isOnline, isSupported } = newV
    
    if(!isOnline) return
    const lues = lastUserEnterStamp.value
    if(!lues) {
      toUserEnter()
      return
    }

    const diffS = time.getTime() - lues
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

