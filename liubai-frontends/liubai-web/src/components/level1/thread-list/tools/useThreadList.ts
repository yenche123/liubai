import { inject, onActivated, onDeactivated, reactive, toRef, toRefs, watch } from "vue"
import threadController from "~/utils/controllers/thread-controller/thread-controller"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { storeToRefs } from "pinia"
import type { SvProvideInject } from "~/types/components/types-scroll-view"
import type { TlProps, TlViewType, TlEmits, TlData, TlContext } from "./types"
import type { TcListOption } from "~/utils/controllers/thread-controller/type"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { svBottomUpKey, scrollViewKey, svScollingKey } from "~/utils/provide-keys";
import { handleLastItemStamp } from "./useTLCommon"
import tlUtil from "./tl-util"
import typeCheck from "~/utils/basic/type-check"
import stateController from "~/utils/controllers/state-controller/state-controller"
import type { ThreadShow } from "~/types/types-content"
import valTool from "~/utils/basic/val-tool"
import liuApi from "~/utils/liu-api"
import { CloudMerger } from "~/utils/cloud/CloudMerger"
import type { SyncGet_ThreadList } from "~/types/cloud/sync-get/types"
import localCache from "~/utils/system/local-cache"

export function useThreadList(
  props: TlProps,
  emits: TlEmits,
) {
  let { viewType, tagId } = toRefs(props)

  const wStore = useWorkspaceStore()
  let spaceIdRef = storeToRefs(wStore).spaceId

  // 获取命令 scroll-view 滚动到期望位置的控制器
  const svBottomUp = inject(svBottomUpKey)

  const cssDetectOverflow = liuApi.canIUse.cssDetectTextOverflow()
  const tlData = reactive<TlData>({
    list: [],
    lastItemStamp: 0,
    hasReachBottom: false,
    requestRefreshNum: 0,
    cssDetectOverflow,
  })

  const ctx: TlContext = {
    tlData,
    spaceIdRef,
    showNum: 0,
    svBottomUp,
    reloadRequired: false,
    emits,
    props,
  }

  // 1. 监听触底/顶加载
  const svData = inject(scrollViewKey, { type: "", triggerNum: 0 }) as SvProvideInject
  const svTrigger = toRef(svData, "triggerNum")
  watch(svTrigger, (newV) => {
    const { type } = svData
    if(isViewType(ctx, "PINNED")) return

    // console.log("触底或触顶.........")
    // console.log(type)
    // console.log(" ")

    if(type === "to_end") {
      if(tlData.hasReachBottom) return
      loadList(ctx)
    }
    else if(type === "to_start") {
      loadList(ctx, true)
    }
  })

  // 2. 监听页面切换，使用 vue 原生的 
  // onActivated / onDeactivated 来实现
  let isActivated = true
  onActivated(() => {
    isActivated = true
    ctx.showNum++
    if(ctx.reloadRequired) {
      scollTopAndUpdate(ctx)
    }
    else if(ctx.showNum > 1) {
      checkList(ctx)
    }
  })
  onDeactivated(() => {
    isActivated = false
  })

  const gStore = useGlobalStateStore()
  const { tagChangedNum } = storeToRefs(gStore)

  // 3. 监听上下文变化
  watch([viewType, tagId, spaceIdRef, tagChangedNum], (
      [newV1, newV2, newV3, newV4],
      [oldV1, oldV2, oldV3, oldV4]
    ) => {
    if(!newV3) return

    // 当 "标签系统" 发生变化时
    if(typeCheck.isNumber(oldV4) && newV4 > oldV4) {
      const whyTagChange = gStore.tagChangedReason
      
      // 若是创建新的标签，则忽略
      // 因为已经存在的标签不会受到影响
      if(whyTagChange === "create") {
        return
      }

      if(!isActivated) {
        ctx.reloadRequired = true
        return
      }

      if(props.showTxt === "false") {
        // console.log("当前是 thread-list 显示状态为 false")
        // console.log("故忽略..............")
        return
      }
    }

    scollTopAndUpdate(ctx)
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
  const scrollPosition = inject(svScollingKey)
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
function scollTopAndUpdate(
  ctx: TlContext,
) {
  if(ctx.svBottomUp && !isViewType(ctx, "PINNED")) {
    ctx.svBottomUp.value = { type: "pixel", pixel: 0 }
  }
  // console.log(`${ctx.viewType.value} ${ctx.tagId.value} 正在执行 scollTopAndUpdate...`)
  loadList(ctx, true)
}

// 页面 onActivated 或者窗口重新被 focus 时，触发该函数
// 来判断要不要重新加载或局部更新
function checkList(
  ctx: TlContext
) {
  if(isViewType(ctx, "PINNED")) return

  const { list } = ctx.tlData
  if(list.length < 10) {
    loadList(ctx, true)
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
  reload: boolean = false
) {

  const spaceId = ctx.spaceIdRef.value
  if(!spaceId) return
  
  const { tlData } = ctx
  if(reload) {
    tlData.hasReachBottom = false
    ctx.reloadRequired = false
  }

  const oldList = tlData.list
  const { viewType, tagId, stateId } = ctx.props

  let length = oldList.length
  let lastItemStamp = reload || (length < 1) ? undefined : tlData.lastItemStamp

  const cloudOpt: LoadCloudOpt = {
    startIndex: 0,
    lastItemStamp,
  }
  let results: ThreadShow[] = []

  // 1. 开始去数据库加载动态
  if(viewType === "STATE" && stateId) {
    // 用 stateController 去加载 某个状态下的更多动态
    const sOpt = {
      stateId,
      excludeInKanban: true,
      lastItemStamp,
    }
    const sData = await stateController.getThreadsOfAState(sOpt)
    results = sData.threads
    cloudOpt.excluded_ids = sData.excluded_ids
    if(!sData.hasMore) {
      tlData.hasReachBottom = true
    }
  }
  else {
    // 用 threadController 直接去加载动态们
    const opt1: TcListOption = {
      viewType,
      spaceId,
      tagId,
      lastItemStamp,
    }
    if(viewType === "FAVORITE") {
      opt1.collectType = "FAVORITE"
    }
    else if(viewType === "PINNED") {
      delete opt1.lastItemStamp
      delete cloudOpt.lastItemStamp
    }
    results = await threadController.getList(opt1)
  }

  // 2. 加载完数据后，开始封装
  const newList = tlUtil.threadShowsToList(results)
  const newLength = newList.length

  // 3. 赋值到 list 上
  if(length < 1 || reload || viewType === "PINNED") {
    tlData.list = newList

    if(newLength) ctx.emits("hasdata")
    else ctx.emits("nodata")
    
  }
  else if(newLength) {
    cloudOpt.startIndex = tlData.list.length
    tlData.list.push(...newList)
  }

  // 4. 处理 lastItemStamp
  if(newLength) {
    handleLastItemStamp(viewType, tlData)
  }

  // 5. 小于一定数量的时候 表示已经触底
  if(newLength < 6) {
    tlData.hasReachBottom = true
  }

  // 6. load cloud
}

interface LoadCloudOpt {
  startIndex: number,
  lastItemStamp?: number,
  excluded_ids?: string[]
}

async function loadCloud(
  ctx: TlContext,
  opt: LoadCloudOpt,
) {
  const hasLogin = localCache.hasLoginWithBackend()
  if(!hasLogin) return

  const { startIndex, lastItemStamp, excluded_ids } = opt
  const spaceId = ctx.spaceIdRef.value
  const { tlData } = ctx
  const { viewType, tagId, stateId } = ctx.props

  const param: SyncGet_ThreadList = {
    taskType: "thread_list",
    spaceId,
    viewType,
    lastItemStamp,
  }
  if(viewType === "STATE") {
    if(!stateId) return
    param.stateId = stateId
    param.excluded_ids = excluded_ids
  }
  else if(viewType === "FAVORITE") {
    param.collectType = "FAVORITE"
  }
  else if(viewType === "TAG") {
    if(!tagId) return
    param.tagId = tagId
  }

  const res1 = await CloudMerger.request(param)
  console.log("CloudMerger res1: ")
  console.log(res1)
  console.log(" ")
  if(!res1) return



}