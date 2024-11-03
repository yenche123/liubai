import { ref } from "vue"
import { TlHasDataOpt } from "~/components/level1/thread-list/tools/types"
import time from "~/utils/basic/time"


export function useScheduleContent() {
  const isEmpty = ref(false)
  const midnightClock = ref("")

  const _reset = () => {
    midnightClock.value = ""
  }


  const onNodata = () => {
    isEmpty.value = true
  }

  const onHasdata = (opt?: TlHasDataOpt) => {
    // 1. set isEmpty
    isEmpty.value = false

    // 2. start to calculate midnightClock
    const firRes = opt?.results?.[0]
    const calendarStamp = firRes?.calendarStamp
    if(!calendarStamp) {
      _reset()
      return
    }
    const now = time.getTime()
    const day = Math.abs(now - calendarStamp) / time.DAY
    if(day >= 1) {
      _reset()
      return
    }

    // 3. get clock
    const date = new Date(now)
    const hrs = date.getHours()
    if(hrs >= 5) {
      _reset()
      return
    }
    midnightClock.value = `${hrs}`
  }

  return {
    isEmpty,
    midnightClock,
    onNodata,
    onHasdata,
  }

}