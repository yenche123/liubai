import type { TlContext } from "./types";
import type { ThreadShow } from "~/types/types-content"
import type { SyncGet_ThreadList } from "~/types/cloud/sync-get/types";
import type { TcListOption } from "~/utils/controllers/thread-controller/type";
import { isToday } from "date-fns"
import time from "~/utils/basic/time"
import threadController from "~/utils/controllers/thread-controller/thread-controller";
import { CloudMerger } from "~/utils/cloud/CloudMerger";
import tlUtil from "./tl-util";
import localCache from "~/utils/system/local-cache";

const MIN_30 = time.MINUTE * 30

export async function handleCalendarList(
  ctx: TlContext,
  cloud: boolean,
) {
  const spaceId = ctx.spaceIdRef.value
  
  const opt1: TcListOption = {
    spaceId,
    viewType: "CALENDAR",
  }

  // 1. load locally
  let results = await threadController.getList(opt1)
  showCalendarList(ctx, results)

  // 2. check if we need to load from cloud
  if(!cloud) return
  const res2 = localCache.hasLoginWithBackend()
  if(!res2) return

  // 3. load from cloud
  const param3: SyncGet_ThreadList = {
    taskType: "thread_list",
    sort: "asc",
    ...opt1,
  }
  const res3 = await CloudMerger.request(param3, { maxStackNum: 4 })
  if(!res3) return

  console.log("远端加载出日历，结果:")
  console.log(res3)
  console.log(" ")

  // 4. load locally again
  results = await threadController.getList(opt1)
  showCalendarList(ctx, results)
}

function showCalendarList(
  ctx: TlContext,
  results: ThreadShow[],
) {
  const { tlData, emits } = ctx
  const { list, title_key } = filterForCalendar(results)

  if(list.length < 1) {
    tlData.list = []
    emits("nodata")
    return
  }

  const newList = tlUtil.threadShowsToList(list)
  tlData.list = newList
  emits("hasdata", { title_key })
}

export function filterForCalendar(
  results: ThreadShow[],
) {
  const date = new Date()
  const hr = date.getHours()

  let list: ThreadShow[] = []

  const next24Hrs = hr >= 22 || hr < 4
  const title_key = next24Hrs ? "index.future_24" : "index.today"

  if(next24Hrs) {
    // load threads within next 24 hrs
    const now = time.getTime()
    const s1 = now - MIN_30
    const s2 = now + time.DAY
    list = results.filter(v => {
      const { calendarStamp } = v
      if(!calendarStamp) return false
      return s1 <= calendarStamp && calendarStamp < s2
    })
  }
  else {
    list = results.filter(v => {
      const { calendarStamp } = v
      if(!calendarStamp) return false
      return isToday(new Date(calendarStamp))
    })
  }

  return { list, title_key }
}