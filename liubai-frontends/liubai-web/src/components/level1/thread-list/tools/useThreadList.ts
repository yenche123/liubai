import { inject, reactive, toRef, toRefs, watch, ref } from "vue"
import threadController from "~/utils/controllers/thread-controller/thread-controller"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { storeToRefs } from "pinia"
import type { SvProvideInject } from "~/types/components/types-scroll-view"
import type { TlProps, TlViewType, TlEmits, TlData, TlContext } from "./types"
import type { TcListOption } from "~/utils/controllers/thread-controller/type"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { 
  svBottomUpKey, 
  scrollViewKey, 
  svScollingKey,
  svPullRefreshKey,
} from "~/utils/provide-keys";
import tlUtil from "./tl-util"
import typeCheck from "~/utils/basic/type-check"
import stateController from "~/utils/controllers/state-controller/state-controller"
import type { ThreadShow } from "~/types/types-content"
import valTool from "~/utils/basic/val-tool"
import liuApi from "~/utils/liu-api"
import { CloudMerger } from "~/utils/cloud/CloudMerger"
import type {
  SyncGet_ThreadList,
  SyncGet_CheckContents,
} from "~/types/cloud/sync-get/types"
import localCache from "~/utils/system/local-cache"
import { useAwakeNum } from "~/hooks/useCommon"
import { useNetworkStore } from "~/hooks/stores/useNetworkStore"
import { handleCalendarList } from "./handle-calendar"
import { type ThreadListViewType } from "~/types/types-view"
import time from "~/utils/basic/time"
import { preLoadCreateFirst, preLoadEditFirst } from "./pre-download"

const SEC_15 = time.SECONED * 15
const MIN_THREADS = 9      // 最少应该有的个数，若少于这个个数，checkList 会触发重新加载
                               // 加载完成时 hasReachedBottom 会设置为 true

export function useThreadList(
  props: TlProps,
  emits: TlEmits,
) {
  let { viewType, tagId } = toRefs(props)

  const wStore = useWorkspaceStore()
  let spaceIdRef = storeToRefs(wStore).spaceId

  // 获取命令 scroll-view 滚动到期望位置的控制器
  const svBottomUp = inject(svBottomUpKey)
  const scrollPosition = inject(svScollingKey)

  const cssDetectOverflow = liuApi.canIUse.cssDetectTextOverflow()
  const tlData = reactive<TlData>({
    list: [],
    lastItemStamp: 0,
    hasReachedBottom: false,
    requestRefreshNum: 0,
    cssDetectOverflow,
  })

  const ctx: TlContext = {
    tlData,
    spaceIdRef,
    svBottomUp,
    reloadRequired: false,
    emits,
    props,
    scrollPosition,
  }

  // 1.1 监听触底/顶加载
  const svData = inject(scrollViewKey, { type: "", triggerNum: 0 }) as SvProvideInject
  const svTrigger = toRef(svData, "triggerNum")
  watch(svTrigger, (newV) => {
    const { type } = svData
    if(isViewType(ctx, "PINNED")) return

    if(type === "to_end") {
      if(isViewType(ctx, "CALENDAR")) return
      if(tlData.hasReachedBottom) return
      loadList(ctx)
    }
    else if(type === "to_start") {
      if(props.showTxt === "F") return
      loadList(ctx, true)
    }
  })

  // 1.2 监听下拉刷新
  const pullRefreshNum = inject(svPullRefreshKey, ref(0))
  watch(pullRefreshNum, (newV) => {
    if(newV < 1) return
    if(isViewType(ctx, "PINNED")) return
    loadList(ctx, true)
  })

  // 2. 监听页面切换 / syncNum 变化
  const {
    isActivated,
    syncNum,
    awakeNum,
  } = useAwakeNum(undefined, props)

  const gStore = useGlobalStateStore()
  const { tagChangedNum } = storeToRefs(gStore)

  const _whenTagSystemChanged = () => {
    const whyTagChange = gStore.tagChangedReason

    // 若是创建新的标签，则忽略
    // 因为已经存在的标签不会受到影响
    if(whyTagChange === "create") {
      return false
    }

    if(!isActivated.value) {
      ctx.reloadRequired = true
      return false
    }

    if(props.showTxt === "F") {
      return false
    }
    return true
  }

  // 3. 监听上下文变化
  watch([viewType, tagId, spaceIdRef, tagChangedNum, awakeNum], (
      [newV1, newV2, newV3, newV4, newV5],
      [oldV1, oldV2, oldV3, oldV4, oldV5]
  ) => {

    if(!newV3) return
    if(!newV5) return

    // 当 "标签系统" 发生变化时
    if(typeCheck.isNumber(oldV4) && newV4 > oldV4) {
      const go = _whenTagSystemChanged()
      if(!go) return
    }

    const cloud = syncNum.value > 0
    if(ctx.reloadRequired) {
      scrollTopAndUpdate(ctx, cloud)
      return
    }

    const isAwakeChanged = newV5 > (oldV5 ?? 0)
    if(isAwakeChanged) {
      checkList(ctx, cloud)
    }
    else {
      scrollTopAndUpdate(ctx, cloud)
    }

  }, { immediate: true })


  // 4. 监听来自同组件其他函数请求重新加载
  const rfNum = toRef(tlData, "requestRefreshNum")
  watch(rfNum, (newV, oldV) => {
    if(newV && newV > oldV) {
      loadList(ctx, true)
    }
  })


  // 5. 获取滚动位置，当卡片被点击展开全文时
  // 恢复定位
  const whenTapBriefing = async () => {
    if(!scrollPosition) return
    const sP1 = scrollPosition.value
    await valTool.waitMilli(60)
    const sP2 = scrollPosition.value
    const diff = sP2 - sP1
    if(diff < 60) return
    if(!svBottomUp) return
    const expectedPixel = Math.max(sP1 - 30, 0)
    svBottomUp.value = { type: "pixel", pixel: expectedPixel }
  }

  return {
    tlData,
    whenTapBriefing,
  }
}

// 滚动到最顶部，然后更新 list
function scrollTopAndUpdate(
  ctx: TlContext,
  cloud: boolean,
) {
  if(ctx.svBottomUp) {
    if(!isViewType(ctx, "PINNED") && !isViewType(ctx, "CALENDAR")) {
      ctx.svBottomUp.value = { type: "pixel", pixel: 0 }
    }
  }
  loadList(ctx, true, cloud)
}

// 页面 onActivated 或者窗口重新被 focus 时，触发该函数
// 来判断要不要重新加载或局部更新
function checkList(
  ctx: TlContext,
  cloud: boolean,
) {
  const { list } = ctx.tlData

  // 1. reload if list.length is less
  if(list.length < MIN_THREADS) {
    loadList(ctx, true, cloud)
    return
  }

  // 2. reload if brosing area is in the top area
  const s1 = ctx.scrollPosition?.value ?? 0
  if(s1 < 500) {
    loadList(ctx, true, cloud)
    return
  }
  
}

function isViewType(ctx: TlContext, val: TlViewType) {
  const vT = ctx.props.viewType
  if(vT === val) return true
  return false
}


// 重新加载 & 触底加载
// 所以该函数并不是局部更新技术，遇到重新加载会整个重置 list
// 遇到触底加载，当为云端来的数据时，会使用云端数据的第一行 id 查找当前 list 里的位置
// 找到后，把该行之后的数据全删除，再赋值云端来的数据进 list 里
async function loadList(
  ctx: TlContext,
  reload: boolean = false,
  cloud: boolean = true,
) {

  const spaceId = ctx.spaceIdRef.value
  if(!spaceId) return

  const { tlData, props } = ctx
  const { viewType: vT, tagId, stateId } = props
  if(vT === "CALENDAR") {
    handleCalendarList(ctx, cloud)
    return
  }

  if(reload) {
    tlData.hasReachedBottom = false
    ctx.reloadRequired = false
  }

  const oldList = tlData.list
  const oldLength = oldList.length
  const isInit = Boolean(reload || oldLength < 1)
  let lastItemStamp = isInit ? undefined : tlData.lastItemStamp

  const cloudOpt: LoadCloudOpt = { 
    startIndex: isInit ? 0 : oldLength, 
    threadShows: [],
  }
  let results: ThreadShow[] = []

  const opt1: TcListOption = {
    spaceId,
    viewType: vT,
    lastItemStamp,
  }

  // 1. 开始去数据库加载动态
  if(vT === "STATE") {
    if(!stateId) return

    // 用 stateController 去加载 某个状态下的更多动态
    const sOpt = {
      stateId,
      excludeInKanban: true,
      lastItemStamp,
    }
    const sData = await stateController.getThreadsOfAState(sOpt)
    results = sData.threads
    opt1.stateId = stateId
    opt1.excluded_ids = sData.excluded_ids
    if(!sData.hasMore) {
      tlData.hasReachedBottom = true
    }
  }
  else {
    // 用 threadController 直接去加载动态们

    if(vT === "FAVORITE") {
      opt1.collectType = "FAVORITE"
    }
    else if(vT === "PINNED") {
      delete opt1.lastItemStamp
    }
    else if(vT === "TAG") {
      if(!tagId) return
      opt1.tagId = tagId
    }

    results = await threadController.getList(opt1)
  }

  // 2. 加载完数据后，开始封装
  cloudOpt.threadShows = results
  const newList = tlUtil.threadShowsToList(results)
  const newLength = newList.length

  // 3. 赋值到 list 上
  if(isInit || vT === "PINNED") {
    cloudOpt.startIndex = 0
    tlData.list = newList

    if(newLength) ctx.emits("hasdata")
    else ctx.emits("nodata")
    
  }
  else if(newLength) {
    tlData.list.push(...newList)
  }


  // test
  // if(vT === "INDEX" && isInit && newLength) {
  //   console.warn("check local results: ")
  //   console.log(valTool.copyObject(newList))
  //   console.log(" ")
  // }


  // 4. 处理 lastItemStamp
  if(newLength) {
    tlUtil.handleLastItemStamp(vT, tlData)
  }

  // 5. 小于一定数量的时候 表示已经触底
  if(newLength < MIN_THREADS) {
    tlData.hasReachedBottom = true
  }

  // 6. load cloud
  if(cloud) {
    loadCloud(ctx, opt1, cloudOpt)
  }
}

interface LoadCloudOpt {
  startIndex: number
  threadShows: ThreadShow[]
}

async function loadCloud(
  ctx: TlContext,
  opt1: TcListOption,
  opt2: LoadCloudOpt,
) {
  const hasLogin = localCache.hasLoginWithBackend()
  if(!hasLogin) return

  const nStore = useNetworkStore()
  if(nStore.level < 1) {
    return
  }

  // 1. param for request
  const param1: SyncGet_ThreadList = {
    taskType: "thread_list",
    ...opt1,
  }

  // 2. set delay
  let delay = Boolean(opt1.lastItemStamp) ? 0 : undefined
  const vT = ctx.props.viewType
  // the following items are not in Home, so we fetch them imediately
  const instant_list: ThreadListViewType[] = [
    "FAVORITE",
    "STATE",
    "TAG",
    "TRASH",
  ]
  if(instant_list.includes(vT)) {
    delay = 0
  }

  // 3. request
  const res1 = await CloudMerger.request(param1, { delay, maxStackNum: 4 })
  if(!res1) return

  // 4. get ids for checking contents
  const ids = CloudMerger.getIdsForCheckingContents(
    res1,
    opt2.threadShows,
    opt1.viewType
  )
  if(ids.length < 1) {
    loadAgain(ctx, opt1, opt2)
    return
  }

  // 5. check ids
  const param5: SyncGet_CheckContents = {
    taskType: "check_contents",
    ids,
  }
  const delay2 = delay === 0 ? 0 : 16
  await CloudMerger.request(param5, { delay: delay2 })

  // 6. load contents locally again
  loadAgain(ctx, opt1, opt2)
}

async function loadAgain(
  ctx: TlContext,
  opt1: TcListOption,
  opt2: LoadCloudOpt,
) {
  // 1. ignore if the item of startIndex doesn't exist and startIndex > 0
  const { tlData, props } = ctx
  const { startIndex } = opt2
  const theOne = tlData.list[startIndex]
  if(startIndex && !theOne) {
    if(!tlData.hasReachedBottom) {
      tlData.hasReachedBottom = true
    }
    return
  }

  // 2. ignore if viewType is not matched
  const vT = props.viewType
  if(opt1.viewType !== vT) return

  let hasMore = false
  let results: ThreadShow[] = []
  if(vT === "STATE") {
    if(!opt1.stateId) return
    const sOpt = {
      stateId: opt1.stateId,
      excludeInKanban: true,
      lastItemStamp: opt1.lastItemStamp,
    }
    const sData = await stateController.getThreadsOfAState(sOpt)
    results = sData.threads
    if(sData.hasMore) hasMore = true
  }
  else {
    results = await threadController.getList(opt1)
  }  

  const newList = tlUtil.threadShowsToList(results)
  const deltaLength = newList.length
  const newLength = deltaLength + startIndex
  const oldLength = tlData.list.length
  if(oldLength > newLength) {
    tlData.list.splice(newLength, oldLength - newLength)
  }
  for(let i=startIndex; i<newLength; i++) {
    tlData.list[i] = newList[i - startIndex]
  }

  // test
  // if(vT === "INDEX" && newLength) {
  //   console.warn("check local results again: ")
  //   console.log("startIndex: ", startIndex)
  //   console.log("deltaLength: ", deltaLength)
  //   console.log("newLength: ", newLength)
  //   console.log("oldLength: ", oldLength)
  //   console.log(valTool.copyObject(newList))
  //   console.log(" ")
  // }

  tlUtil.handleLastItemStamp(vT, tlData)

  if(hasMore || deltaLength >= MIN_THREADS) {
    tlData.hasReachedBottom = false
  }
  else {
    tlData.hasReachedBottom = true
  }

  preDownloadContents(ctx, results)
}


let hasPreDownload = false
async function preDownloadContents(
  ctx: TlContext,
  results: ThreadShow[],
) {
  // 1. check if we can pre-download
  const vt1 = ctx.props.viewType
  if(vt1 !== "INDEX") return
  const spaceId = ctx.spaceIdRef.value
  if(!spaceId) return
  if(hasPreDownload) return
  hasPreDownload = true
  const rLength = results.length
  if(rLength < 10) return

  // 2. decide which one to download first
  const localPf = localCache.getPreference()
  const loginStamp = localPf.loginStamp ?? 1
  const justLogged = time.isWithinMillis(loginStamp, SEC_15)

  // 3. load created first
  if(justLogged) {
    preLoadCreateFirst(spaceId)
    return
  }

  // 4. load edit first
  preLoadEditFirst(spaceId, localPf.loadEditStamp)
}
