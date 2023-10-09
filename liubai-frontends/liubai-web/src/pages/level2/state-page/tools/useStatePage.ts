import { onActivated, onDeactivated, provide, reactive, ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import { stateProvideKey } from "./types"
import type { 
  StateWhichPage, 
  KanbanData,
  StateProvideData,
  StatePageCtx,
} from "./types"
import type { KanbanColumn } from "~/types/types-content"
import type { LiuAtomState, WhyThreadChange } from "~/types/types-atom"
import stateController from "~/utils/controllers/state-controller/state-controller"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { storeToRefs } from "pinia"
import { useLiuWatch } from "~/hooks/useLiuWatch"
import { kanbanInnerChangeKey } from "~/utils/provide-keys"
import time from "~/utils/basic/time"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import cui from "~/components/custom-ui"
import cfg from "~/config"
import ider from "~/utils/basic/ider"
import liuUtil from "~/utils/liu-util"

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
  initProvideData(ctx)

  return {
    whichPage,
    onNaviChange,
    kanban,
  }
}


function initProvideData(
  ctx: StatePageCtx
) {

  const onTapReload = () => {
    toRefresh(ctx)
  }

  const onTapAddState = () => {
    toAddState(ctx)
  }

  const stateProvideData: StateProvideData = {
    showReload: ctx.showReload,
    tapreload: onTapReload,
    tapaddstate: onTapAddState,
  }

  provide(stateProvideKey, stateProvideData)
}

async function toAddState(
  ctx: StatePageCtx,
) {
  const stateList = stateController.getStates()
  if(stateList.length >= cfg.max_kanban_column) {
    cui.showModal({
      title_key: "state_related.kanban_h1",
      content_key: "state_related.kanban_b1",
      content_opt: { max: "8" },
      showCancel: false
    })
    return
  }

  const res = await cui.showStateEditor({ mode: "create" })
  if(res.action !== "confirm" || !res.data) return
  const rData = res.data

  // 检查名称是否重复
  let replicated = false
  stateList.forEach(v => {
    if(v.text === rData.text) replicated = true
  })
  if(replicated) {
    cui.showModal({
      title_key: "tip.tip",
      content_key: "state_related.replicate_kanban_name",
      showCancel: false,
    })
    return
  }

  const now = time.getTime()

  // 去创建
  let atom = {
    id: ider.createStateId(),
    showInIndex: rData.showInIndex,
    showFireworks: rData.showFireworks,
    text: rData.text,
    color: rData.color,
    contentIds: [],
    updatedStamp: now,
    insertedStamp: now,
  }
  stateList.splice(0, 0, atom)
  const res2 = await stateController.setNewStateList(stateList)
  
  // 在视图上创建一个
  const { kanban } = ctx
  const col: KanbanColumn = {
    id: atom.id,
    showInIndex: atom.showInIndex,
    showFireworks: atom.showInIndex,
    text: atom.text,
    colorShow: liuUtil.colorToShow(atom.color),
    threads: [],
    updatedStamp: now,
    insertedStamp: now,
    hasMore: false,
  }
  kanban.columns.splice(0, 0, col)
}

async function toRefresh(
  ctx: StatePageCtx,
  snackbar: boolean = true
) {
  const { kanban } = ctx
  const stateList = stateController.getStates()
  const columns = transferStateListToColumns(stateList)
  const oldList = kanban.columns
  const newList: KanbanColumn[] = []
  for(let i=0; i<columns.length; i++) {
    const v1 = columns[i]
    const v2 = oldList.find(v => v.id === v1.id)
    if(v2) {
      newList.push(v2)
    }
    else {
      newList.push(v1)
    }
  }
  kanban.columns = newList

  await toGetThreads(ctx)
  if(snackbar) cui.showSnackBar({ text_key: "tip.refreshed" })
}


function listenThreadShowChanged(
  ctx: StatePageCtx
) {
  let isActivated = false
  let reloadRequired = false
  const followEvents: WhyThreadChange[] = [
    "delete", 
    "delete_forever", 
    "undo_delete",
    "state",
    "undo_state",
    "restore",
    "float_up",
    "undo_float_up",
  ]

  // 内部改变的时间戳
  const lastInnerStampRef = ref(time.getTime())
  provide(kanbanInnerChangeKey, lastInnerStampRef)

  const tStore = useThreadShowStore()
  tStore.$subscribe((mutation, state) => {
    const now = time.getTime()
    const diff = now - lastInnerStampRef.value
    if(diff < 600) {
      // console.log("刚刚 600ms 内，kanban 内有触发变化，故阻断！！！！")
      return
    }

    const tmp = followEvents.includes(state.whyChange)
    if(!tmp) return

    if(isActivated) {
      toRefresh(ctx, false)
    }
    else {
      reloadRequired = true
    }
  })

  onActivated(() => {
    isActivated = true
    if(reloadRequired) {
      ctx.showReload.value = true
      toRefresh(ctx, false)
    }
    reloadRequired = false
  })

  onDeactivated(() => {
    isActivated = false
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
      color = "--liu-state-1"
      if(v.id === "FINISHED") color = "--liu-state-2"
    }
    let colorShow = liuUtil.colorToShow(color)

    const obj: KanbanColumn = {
      id: v.id,
      showInIndex: v.showInIndex,
      showFireworks: v.showFireworks,
      text,
      text_key,
      colorShow,
      threads: [],
      updatedStamp: v.updatedStamp,
      insertedStamp: v.insertedStamp,
      hasMore: false,
    }
    return obj
  })

  return columns
}
