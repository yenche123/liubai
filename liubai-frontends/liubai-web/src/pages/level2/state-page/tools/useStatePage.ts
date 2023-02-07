import { provide, reactive, ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import { kanbanReloadKey } from "./types"
import type { 
  StateWhichPage, 
  KanbanData,
  KanbanReload,
  StatePageCtx,
} from "./types"
import type { KanbanColumn } from "~/types/types-content"
import type { LiuAtomState } from "~/types/types-atom"
import stateController from "~/utils/controllers/state-controller/state-controller"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { storeToRefs } from "pinia"
import { useLiuWatch } from "~/hooks/useLiuWatch"
import { kanbanInnerChangeKey } from "~/utils/provide-keys"
import time from "~/utils/basic/time"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import { recalculateKanban } from "./recalculateKanban"
import cui from "~/components/custom-ui"

export function useStatePage() {

  /************** 处理布局 *************/
  // 1: 列表;    2: 看板
  const whichPage = ref<StateWhichPage>(0)

  // 判断 优先展示列表还是看板
  const { width } = useWindowSize()
  if(width.value < 600) whichPage.value = 1
  else whichPage.value = 2

  const onNaviChange = (index: StateWhichPage) => {
    whichPage.value = index
  }


  /*************** 处理数据 ***********/
  const kanban = reactive<KanbanData>({
    name: "kanban_is_really_cool",
    columns: []
  })
  const showReload = ref(false)
  const ctx: StatePageCtx = {
    kanban,
    showReload,
  }


  initKanbanColumns(ctx)

  /*************** 监听 thread-show 的变化 **********/
  listenThreadShowChanged(ctx)

  /*************** 传递 reload 给子组件 ************** */
  initReload(ctx)

  return {
    whichPage,
    onNaviChange,
    kanban,
  }
}


function initReload(
  ctx: StatePageCtx
) {

  const onTapReload = async () => {
    toGetColumns(ctx)
    await toGetThreads(ctx)
    cui.showSnackBar({ text_key: "tip.refreshed" })
  }

  const reloadData: KanbanReload = {
    showReload: ctx.showReload,
    tapreload: onTapReload
  }

  provide(kanbanReloadKey, reloadData)
}


function listenThreadShowChanged(
  ctx: StatePageCtx
) {
  const { kanban } = ctx
  // 内部改变的时间戳
  const lastInnerStampRef = ref(time.getTime())
  provide(kanbanInnerChangeKey, lastInnerStampRef)

  const tStore = useThreadShowStore()
  tStore.$subscribe((mutation, state) => {
    const now = time.getTime()
    const diff = now - lastInnerStampRef.value
    if(diff < 600) {
      return
    }

    ctx.showReload.value = true
    recalculateKanban(kanban)
  })
}


function initKanbanColumns(
  ctx: StatePageCtx
) {
  const wStore = useWorkspaceStore()
  const spaceIdRef = storeToRefs(wStore).spaceId

  const _getThreads = () => {
    toGetThreads(ctx)
  }

  const _getColumns = () => {
    toGetColumns(ctx)
    _getThreads()
  }

  useLiuWatch(spaceIdRef, _getColumns)
}

function toGetColumns(
  ctx: StatePageCtx
) {
  const { kanban } = ctx
  const stateList = stateController.getStates()
  kanban.columns = transferStateListToColumns(stateList)
}

async function toGetThreads(
  ctx: StatePageCtx
) {
  const { kanban } = ctx
  for(let i=0; i<kanban.columns.length; i++) {
    const col = kanban.columns[i]

    const opt = {
      stateId: col.id, 
      excludeInKanban: false,
    }
    const data = await stateController.getThreadsOfAThread(opt)

    col.hasMore = data.hasMore
    col.threads = data.threads
  }
}


function transferStateListToColumns(
  stateList: LiuAtomState[]
) {

  const columns = stateList.map(v => {
    // 处理文字
    let text_key = ""
    let text = v.text
    if(!text) {
      if(v.id === "TODO") text_key = "thread_related.todo"
      else if(v.id === "FINISHED") text_key = "thread_related.finished"
    }

    // 处理颜色
    let color = v.color
    if(!color) {
      color = "var(--liu-state-1)"
      if(v.id === "FINISHED") color = "var(--liu-state-2)"
    }

    const obj: KanbanColumn = {
      id: v.id,
      showInIndex: v.showInIndex,
      text,
      text_key,
      color,
      threads: [],
      updatedStamp: v.updatedStamp,
      insertedStamp: v.insertedStamp,
      hasMore: false,
    }
    return obj
  })

  return columns
}
