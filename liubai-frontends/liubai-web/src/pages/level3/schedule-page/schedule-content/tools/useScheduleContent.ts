import { reactive } from "vue"
import type { TlHasDataOpt } from "~/components/level1/thread-list/tools/types"
import time from "~/utils/basic/time"
import liuUtil from "~/utils/liu-util"
import type { ScData } from "./types"


export function useScheduleContent() {
  const scData = reactive<ScData>({
    isEmpty: false,
    tipClock: "",
    tipToday: "",
  })

  const _reset = () => {
    scData.tipClock = ""
    scData.tipToday = ""
  }


  const onNodata = () => {
    scData.isEmpty = true
  }

  const onHasdata = (opt?: TlHasDataOpt) => {
    // 1. set isEmpty
    scData.isEmpty = false
    
    // 2. start to calculate tipClock
    const firRes = opt?.results?.[0]
    const calendarStamp = firRes?.calendarStamp
    if(!calendarStamp) {
      _reset()
      return
    }
    
    // 3. reset if the duration from now is more than 1 day
    const now = time.getTime()
    const day = Math.abs(now - calendarStamp) / time.DAY
    if(day >= 1) {
      _reset()
      return
    }

    // 4. reset if it's already past 5am
    const date = new Date(now)
    const hrs = date.getHours()
    if(hrs >= 5) {
      _reset()
      return
    }
    
    // 5. set tipClock and tipToday
    scData.tipClock = `${hrs}`
    scData.tipToday = liuUtil.showMonthAndDay(now)
  }

  return {
    scData,
    onNodata,
    onHasdata,
  }

}