import { inject, onActivated, onDeactivated, ref, toRef, toRefs, watch } from "vue"
import type { ThreadShow } from "~/types/types-content"
import type { Ref, ShallowRef } from "vue"
import threadController from "~/utils/controllers/thread-controller/thread-controller"
import { scrollViewKey } from "~/utils/provide-keys"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { storeToRefs } from "pinia"
import type { OState } from "~/types/types-basic"
import type { SvProvideInject, SvBottomUp } from "../../../common/scroll-view/tools/types"
import type { TlProps, TlViewType } from "./types"
import type { TcListOption } from "~/utils/controllers/thread-controller/type"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { svBottomUpKey } from "~/utils/provide-keys";

interface TlContext {
  list: Ref<ThreadShow[]>
  viewType: Ref<TlViewType>
  tagId: Ref<string>
  workspace: Ref<string>
  showNum: number
  lastItemStamp: Ref<number>
  svBottomUp?: ShallowRef<SvBottomUp>
  reloadRequired: boolean
}

export function useThreadList(props: TlProps) {
  let { viewType, tagId } = toRefs(props)

  const spaceStore = useWorkspaceStore()
  let workspace = storeToRefs(spaceStore).workspace
  const svBottomUp = inject(svBottomUpKey)

  const list = ref<ThreadShow[]>([])
  const ctx: TlContext = {
    list,
    viewType: viewType as Ref<TlViewType>,
    tagId,
    workspace,
    showNum: 0,
    lastItemStamp: ref(0),
    svBottomUp,
    reloadRequired: false
  }

  // 监听触底/顶加载
  const svData = inject(scrollViewKey, { type: "", triggerNum: 0 }) as SvProvideInject
  const svTrigger = toRef(svData, "triggerNum")
  watch(svTrigger, (newV) => {
    const { type } = svData
    if(isViewType(ctx, "PINNED")) return
    if(type === "to_lower") {
      loadList(ctx)
    }
    else if(type === "to_upper") {
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

  watch([viewType, tagId, workspace, tagChangedNum], (
      [newV1, newV2, newV3, newV4],
      [oldV1, oldV2, oldV3, oldV4]
    ) => {
    if(!newV3) return
    if(newV4 > oldV4 && !isActivated) {
      console.log("useThreadList 监听到 tag 发生变化，但是不在显示范围内！")
      ctx.reloadRequired = true
      return
    }

    scollTopAndUpdate(ctx)
  })

  // 如果 workspace 已经存在了，那么就不会触发上方的 watch
  // 所以这里加一段 loadList
  if(workspace.value) {
    loadList(ctx, true)
  }

  return { list }
}

// 滚动到最顶部，然后更新 list
function scollTopAndUpdate(
  ctx: TlContext,
) {
  if(ctx.svBottomUp && !isViewType(ctx, "PINNED")) {
    ctx.svBottomUp.value = { type: "pixel", pixel: 0 }
  }
  console.log(`${ctx.viewType.value} ${ctx.tagId.value} 正在执行 scollTopAndUpdate...`)
  loadList(ctx, true)
}

// 页面 onActivated 或者窗口重新被 focus 时，触发该函数
// 来判断要不要重新加载或局部更新
function checkList(
  ctx: TlContext
) {
  if(isViewType(ctx, "PINNED")) return

  console.log("checkList 被触发...........")

  const { list } = ctx
  if(list.value.length < 10) {
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
  const workspace = ctx.workspace.value
  if(!workspace) return
  if(reload) {
    ctx.reloadRequired = false
  }

  console.log("let's load list!!!!!!!!!!!")

  const oldList = ctx.list.value
  const viewType = ctx.viewType.value
  const tagId = ctx.tagId.value

  let length = oldList.length
  let oState: OState = viewType === 'TRASH' ? 'REMOVED' : 'OK'
  let lastItemStamp = reload || length < 1 ? undefined : ctx.lastItemStamp.value

  const opt1: TcListOption = {
    viewType,
    workspace,
    tagId,
    lastItemStamp,
    oState,
  }
  if(viewType === "FAVORITE") {
    opt1.collectType = "FAVORITE"
  }
  else if(viewType === "PINNED") {
    opt1.loadPin = true
    delete opt1.lastItemStamp
  }

  const results = await threadController.getList(opt1)

  // 赋值到 list 上
  if(length < 1 || reload || viewType === "PINNED") {
    ctx.list.value = results
  }
  else if(results.length) {
    ctx.list.value.push(...results)
  }

  // 处理 lastItemStamp
  if(results.length) {
    const lastItem = results[results.length - 1]
    if(viewType === "FAVORITE") {
      ctx.lastItemStamp.value = lastItem.myFavoriteStamp ?? 0
    }
    else if(viewType === "TRASH") {
      ctx.lastItemStamp.value = lastItem.updatedStamp
    }
    else {
      ctx.lastItemStamp.value = lastItem.createdStamp
    }
  }
  

}