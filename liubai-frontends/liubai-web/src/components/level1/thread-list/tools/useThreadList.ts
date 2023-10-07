import { inject, onActivated, onDeactivated, reactive, toRef, toRefs, watch } from "vue"
import threadController from "~/utils/controllers/thread-controller/thread-controller"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { storeToRefs } from "pinia"
import type { OState } from "~/types/types-basic"
import type { SvProvideInject } from "~/types/components/types-scroll-view"
import type { TlProps, TlViewType, TlEmits, TlData, TlContext } from "./types"
import type { TcListOption } from "~/utils/controllers/thread-controller/type"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { svBottomUpKey, scrollViewKey } from "~/utils/provide-keys";
import { handleLastItemStamp } from "./useTLCommon"
import tlUtil from "./tl-util"
import typeCheck from "~/utils/basic/type-check"
import stateController from "~/utils/controllers/state-controller/state-controller"
import type { ThreadShow } from "~/types/types-content"

export function useThreadList(
  props: TlProps,
  emits: TlEmits,
) {
  let { viewType, tagId } = toRefs(props)

  const wStore = useWorkspaceStore()
  let spaceIdRef = storeToRefs(wStore).spaceId
  const svBottomUp = inject(svBottomUpKey)

  const tlData = reactive<TlData>({
    list: [],
    lastItemStamp: 0,
    hasReachBottom: false,
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

  // 监听触底/顶加载
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

  return {
    tlData,
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
  let oState: OState = viewType === 'TRASH' ? 'REMOVED' : 'OK'
  let lastItemStamp = reload || (length < 1) ? undefined : tlData.lastItemStamp

  let results: ThreadShow[] = []

  // 1. 开始去数据库加载动态
  if(viewType === "STATE" && stateId) {
    // 用 stateController 去加载 某个状态下的更多动态
    const sOpt = {
      stateId,
      excludeInKanban: true,
      lastItemStamp,
    }
    const sData = await stateController.getThreadsOfAThread(sOpt)
    results = sData.threads
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
      oState,
    }
    if(viewType === "FAVORITE") {
      opt1.collectType = "FAVORITE"
    }
    else if(viewType === "PINNED") {
      delete opt1.lastItemStamp
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
}