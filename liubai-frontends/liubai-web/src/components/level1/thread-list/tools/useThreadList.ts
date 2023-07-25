import { inject, onActivated, onDeactivated, reactive, ref, toRef, toRefs, watch } from "vue"
import type { Ref, ShallowRef } from "vue"
import threadController from "~/utils/controllers/thread-controller/thread-controller"
import { scrollViewKey } from "~/utils/provide-keys"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { storeToRefs } from "pinia"
import type { OState } from "~/types/types-basic"
import type { SvProvideInject, SvBottomUp } from "~/types/components/types-scroll-view"
import type { TlProps, TlViewType, TlEmits, TlData } from "./types"
import type { TcListOption } from "~/utils/controllers/thread-controller/type"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { svBottomUpKey } from "~/utils/provide-keys";
import { handleLastItemStamp } from "./useTLCommon"
import tlUtil from "./tl-util"

interface TlContext {
  tlData: TlData,
  viewType: Ref<TlViewType>
  tagId: Ref<string>
  spaceIdRef: Ref<string>
  showNum: number
  svBottomUp?: ShallowRef<SvBottomUp>
  reloadRequired: boolean
  emits: TlEmits
}

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
    viewType: viewType as Ref<TlViewType>,
    tagId,
    spaceIdRef,
    showNum: 0,
    svBottomUp,
    reloadRequired: false,
    emits,
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

    if(newV4 > oldV4) {
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
  })

  // 如果 workspace 已经存在了，那么就不会触发上方的 watch
  // 所以这里加一段 loadList
  if(spaceIdRef.value) {
    loadList(ctx, true)
  }

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
  const vT = ctx.viewType.value
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
  const viewType = ctx.viewType.value
  const tagId = ctx.tagId.value

  let length = oldList.length
  let oState: OState = viewType === 'TRASH' ? 'REMOVED' : 'OK'
  let lastItemStamp = reload || (length < 1) ? undefined : tlData.lastItemStamp

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

  const results = await threadController.getList(opt1)
  const newList = tlUtil.threadShowsToList(results)
  const newLength = newList.length

  // 赋值到 list 上
  if(length < 1 || reload || viewType === "PINNED") {
    tlData.list = newList

    if(newLength) ctx.emits("hasdata")
    else ctx.emits("nodata")
    
  }
  else if(newLength) {
    tlData.list.push(...newList)
  }

  // 处理 lastItemStamp
  if(newLength) {
    handleLastItemStamp(viewType, tlData)
  }

  // 小于一定数量的时候 表示已经触底
  if(newLength < 6) {
    tlData.hasReachBottom = true
  }
}