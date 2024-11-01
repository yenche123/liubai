import type { ThreadShow } from "~/types/types-content"
import type { TlAtom, TlData, TlViewType } from "./types"
import { i18n } from '~/locales'
import dateTool from "~/utils/basic/date-tool"
import time from "~/utils/basic/time"
import liuUtil from "~/utils/liu-util"

// 将 ThreadShow 转为 thread-list 的格式
function threadShowsToList(
  results: ThreadShow[],
  viewType?: TlViewType,
) {
  const newList: TlAtom[] = []
  results.forEach(v => {
    const obj = threadShowToItem(v, viewType)
    newList.push(obj)
  })
  return newList
}

function threadShowToItem(
  thread: ThreadShow,
  viewType?: TlViewType,
): TlAtom {
  const obj: TlAtom = {
    thread,
    showType: "normal",
  }
  if(viewType === "TODAY_FUTURE" || viewType === "PAST") {
    obj.dateText = handleDateText(thread)
  }

  return obj
}


function handleDateText(thread: ThreadShow) {

  // 1. get the date of calendarStamp
  const stamp = thread.calendarStamp
  if(!stamp) return
  const d = new Date(stamp)

  // 2. i18n
  const { t, locale } = i18n.global
  const lang = locale.value

  // 3. today, yesterday, or tomorrow
  if(dateTool.isToday(d)) {
    return t("common.today")
  }
  if(dateTool.isYesterday(d)) {
    return t("common.yesterday")
  }
  if(dateTool.isTomorrow(d)) {
    return t("common.tomorrow")
  }


  // 4. the stamp is in this month
  if(dateTool.isThisMonth(d)) {
    return liuUtil.showMonthAndDay(stamp)
  }

  // 5. get current date
  const now = time.getTime()
  const d5 = new Date(now)
  const date5 = d5.getDate()

  // 6. past
  if(dateTool.isPast(d)) {
    if(!dateTool.isThisYear(d)) {
      return liuUtil.showYearAndMonth(stamp)
    }

    if(dateTool.isPreviousMonth(d)) {
      if(date5 < 15) {
        return liuUtil.showMonthAndDay(stamp)
      }
    }

    return liuUtil.showYearAndMonth(stamp)
  }
  
  // 7. future
  if(!dateTool.isThisYear(d)) {
    return liuUtil.showYearAndMonth(stamp)
  }
  if(dateTool.isNextMonth(d)) {
    if(date5 >= 15) {
      return liuUtil.showMonthAndDay(stamp)
    }
  }

  return liuUtil.showYearAndMonth(stamp)
}

function handleLastItemStamp(
  vT: TlViewType,
  tlData: TlData,
) {
  const { list } = tlData
  const listLength = list.length
  const lastItem = list[listLength - 1]
  if(!lastItem) {
    if(tlData.lastItemStamp) tlData.lastItemStamp = 0
    return
  }
  const lastThread = lastItem.thread

  if(vT === "FAVORITE") {
    tlData.lastItemStamp = lastThread.myFavoriteStamp ?? 0
  }
  else if(vT === "TRASH") {
    tlData.lastItemStamp = lastThread.removedStamp ?? 0
  }
  else if(vT === "TODAY_FUTURE" || vT === "PAST") {
    tlData.lastItemStamp = lastThread.calendarStamp ?? 0
  }
  else {
    tlData.lastItemStamp = lastThread.createdStamp
  }
}

export default {
  threadShowsToList,
  threadShowToItem,
  handleLastItemStamp,
}