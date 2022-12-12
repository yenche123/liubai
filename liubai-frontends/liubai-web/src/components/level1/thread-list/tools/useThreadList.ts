import { inject, onActivated, ref, toRef, toRefs, watch } from "vue"
import type { ThreadShow } from "../../../../types/types-content"
import type { Ref } from "vue"
import threadController from "../../../../utils/controllers/thread-controller/thread-controller"
import { scrollViewKey } from "../../../../utils/provide-keys"
import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore"
import { storeToRefs } from "pinia"
import type { OState } from "../../../../types/types-basic"
import type { SvProvideInject } from "../../../common/scroll-view/tools/types"
import type { TlProps } from "./types"

interface TlContext {
  list: Ref<ThreadShow[]>
  viewType: Ref<string>
  tagId: Ref<string>
  workspace: Ref<string>
  showNum: number
}

export function useThreadList(props: TlProps) {
  let { viewType, tagId } = toRefs(props)

  const spaceStore = useWorkspaceStore()
  let workspace = storeToRefs(spaceStore).workspace

  const list = ref<ThreadShow[]>([])
  const ctx: TlContext = {
    list,
    viewType,
    tagId,
    workspace,
    showNum: 0,
  }

  // 监听触底/顶加载
  const svData = inject(scrollViewKey, { type: "", triggerNum: 0 }) as SvProvideInject
  const svTrigger = toRef(svData, "triggerNum")
  watch(svTrigger, (newV) => {
    const { type } = svData
    if(type === "to_lower") {
      loadList(ctx)
    }
    else if(type === "to_upper") {
      loadList(ctx, true)
    }
  })

  onActivated(() => {
    ctx.showNum++
    if(ctx.showNum > 1) {
      checkList(ctx)
    }
  })

  watch([viewType, tagId, workspace], ([newViewType, newTagId, newWorkspace]) => {
    if(!newWorkspace) return
    loadList(ctx, true)
  })

  // 如果 workspace 已经存在了，那么就不会触发上方的 watch
  // 所以这里加一段 loadList
  if(workspace.value) {
    loadList(ctx, true)
  }
  

  return { list }
}

// 页面 onActivated 或者窗口重新被 focus 时，触发该函数
// 来判断要不要重新加载或局部更新
function checkList(
  ctx: TlContext
) {
  const { list } = ctx
  if(list.value.length < 1) {
    loadList(ctx)
    return
  }

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

  const oldList = ctx.list.value
  const viewType = ctx.viewType.value
  const tagId = ctx.tagId.value

  let length = oldList.length
  let lastCreatedStamp = reload || length < 1 ? undefined : oldList[length - 1].createdStamp
  let oState: OState = viewType === 'TRASH' ? 'REMOVED' : 'OK'

  const opt1 = {
    workspace,
    tagId,
    lastCreatedStamp,
    oState,
  }

  const results = await threadController.getList(opt1)
  if(length < 1 || reload) {
    ctx.list.value = results
  }
  else if(results.length) {
    ctx.list.value.push(...results)
  }
  

}