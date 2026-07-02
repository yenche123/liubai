import type { TlContext } from "./types";
import type { ThreadShow } from "~/types/types-content"
import type {
  LiuDownloadParcel,
  SyncGet_ThreadList,
  SyncGet_CheckContents,
} from "~/types/cloud/sync-get/types";
import type { TcListOption } from "~/utils/controllers/thread-controller/type";
import threadController from "~/utils/controllers/thread-controller/thread-controller";
import { CloudMerger } from "~/utils/cloud/CloudMerger";
import { useNetworkStore } from "~/hooks/stores/useNetworkStore";
import tlUtil from "./tl-util";
import localCache from "~/utils/system/local-cache";
import cfg from "~/config";

// 单月翻页次数的防御性上限（16 * 20 = 320 条 / 月）
const MAX_PAGES = 20

// 整月加载 [calendarStart, calendarEnd) 内的数据
// CALENDAR_RANGE 作为日历的 headless 数据引擎，没有滚动触底事件可以驱动翻页，
// 所以在这里用游标循环把整个区间一次性拉完（本地和云端各自循环）
export async function handleCalendarRangeList(
  ctx: TlContext,
  cloud: boolean,
) {
  const spaceId = ctx.spaceIdRef.value
  const { calendarStart, calendarEnd } = ctx.props
  if(!spaceId) return
  if(typeof calendarStart !== "number") return
  if(typeof calendarEnd !== "number") return

  // 0. 防竞态：切月或重载会开启新一轮加载，旧一轮在每个 await 之后自行退出
  const loadId = (ctx.calendarRangeLoadId ?? 0) + 1
  ctx.calendarRangeLoadId = loadId
  const isExpired = () => {
    if(ctx.calendarRangeLoadId !== loadId) return true
    if(ctx.props.calendarStart !== calendarStart) return true
    if(ctx.props.calendarEnd !== calendarEnd) return true
    return false
  }

  // 1. load the whole month locally
  let results = await loadMonthLocally(spaceId, calendarStart, calendarEnd)
  if(isExpired()) return
  showRangeList(ctx, results)

  // 2. check if we need to load from cloud
  if(!cloud) return
  const hasLogin = localCache.hasLoginWithBackend()
  if(!hasLogin) return
  const nStore = useNetworkStore()
  if(nStore.level < 1) return

  // 3. load the whole month from cloud, page by page
  const parcels = await loadMonthFromCloud(
    spaceId, calendarStart, calendarEnd, isExpired,
  )
  if(isExpired() || !parcels) return

  // 4. check contents
  const ids = CloudMerger.getIdsForCheckingContents(
    parcels,
    results,
    "CALENDAR_RANGE",
  )
  if(ids.length > 0) {
    const param4: SyncGet_CheckContents = {
      taskType: "check_contents",
      ids,
    }
    await CloudMerger.request(param4, { delay: 16 })
    if(isExpired()) return
  }

  // 5. load locally again
  results = await loadMonthLocally(spaceId, calendarStart, calendarEnd)
  if(isExpired()) return
  showRangeList(ctx, results)
}

async function loadMonthLocally(
  spaceId: string,
  calendarStart: number,
  calendarEnd: number,
) {
  const limit = cfg.default_limit_num
  let results: ThreadShow[] = []
  let lastItemStamp: number | undefined
  let excluded_ids: string[] | undefined

  for(let i = 0; i < MAX_PAGES; i++) {
    const opt: TcListOption = {
      spaceId,
      viewType: "CALENDAR_RANGE",
      calendarStart,
      calendarEnd,
      lastItemStamp,
      excluded_ids,
      limit,
    }
    const page = await threadController.getList(opt)
    results = results.concat(page)
    if(page.length < limit) break

    // 游标为含等值查询（>=），把已加载且 calendarStamp 相同的项放入 excluded_ids，
    // 避免多条数据共享同一 calendarStamp 时翻页漏数据
    const nextStamp = page[page.length - 1].calendarStamp
    if(!nextStamp) break
    lastItemStamp = nextStamp
    excluded_ids = results.filter(v => v.calendarStamp === nextStamp).map(v => v._id)
  }

  return results
}

async function loadMonthFromCloud(
  spaceId: string,
  calendarStart: number,
  calendarEnd: number,
  isExpired: () => boolean,
) {
  const limit = cfg.default_limit_num
  let parcels: LiuDownloadParcel[] = []
  let lastItemStamp: number | undefined
  let excluded_ids: string[] | undefined

  for(let i = 0; i < MAX_PAGES; i++) {
    const param: SyncGet_ThreadList = {
      taskType: "thread_list",
      spaceId,
      viewType: "CALENDAR_RANGE",
      calendarStart,
      calendarEnd,
      lastItemStamp,
      excluded_ids,
      limit,
    }
    const delay = i > 0 ? 0 : undefined
    const res = await CloudMerger.request(param, { delay, maxStackNum: 4 })
    if(isExpired()) return
    if(!res) break
    parcels = parcels.concat(res)
    if(res.length < limit) break

    // 用本页最大的 calendarStamp 作为下一页游标；云端对 CALENDAR_RANGE 为含等值查询（>=），
    // 需把已加载且 calendarStamp 相同的记录放入 excluded_ids，避免同 stamp 翻页漏数据
    let maxStamp = 0
    res.forEach(p => {
      if(p.parcelType !== "content") return
      const cs = p.content?.calendarStamp
      if(cs && cs > maxStamp) maxStamp = cs
    })
    if(!maxStamp) break
    lastItemStamp = maxStamp
    excluded_ids = []
    parcels.forEach(p => {
      if(p.parcelType !== "content") return
      if(p.content?.calendarStamp === maxStamp) excluded_ids?.push(p.id)
    })
  }

  return parcels
}

function showRangeList(
  ctx: TlContext,
  results: ThreadShow[],
) {
  const { tlData, emits } = ctx
  tlData.list = tlUtil.threadShowsToList(results)
  tlData.hasReachedBottom = true
  tlUtil.handleLastItemStamp("CALENDAR_RANGE", tlData)

  if(results.length > 0) emits("hasdata", { results })
  else emits("nodata")
}
