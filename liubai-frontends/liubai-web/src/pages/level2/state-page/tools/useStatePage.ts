import { reactive, ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import type { StateWhichPage, KanbanData } from "./types"
import type { KanbanColumn } from "~/types/types-content"
import type { LiuAtomState } from "~/types/types-atom"
import stateController from "~/utils/controllers/state-controller/state-controller"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { storeToRefs } from "pinia"
import { useLiuWatch } from "~/hooks/useLiuWatch"
import valTool from "~/utils/basic/val-tool"

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
  initKanbanColumns(kanban)

  return {
    whichPage,
    onNaviChange,
    kanban,
  }
}


function initKanbanColumns(
  kanban: KanbanData
) {
  const wStore = useWorkspaceStore()
  const spaceIdRef = storeToRefs(wStore).spaceId

  const _getThreads = async () => {
    for(let i=0; i<kanban.columns.length; i++) {
      const col = kanban.columns[i]

      const opt = {
        stateId: col.id, 
        excludeInKanban: false,
      }
      const data = await stateController.getThreadsOfAThread(opt)

      console.log("_getThreads: ")
      console.log(data)
      console.log(" ")

      col.hasMore = data.hasMore
      col.threads = data.threads
    }
  }

  const _getColumns = () => {
    const stateList = stateController.getStates()
    kanban.columns = transferStateListToColumns(stateList)

    console.log("看一下当前的 columns: ")
    console.log(valTool.copyObject(kanban.columns))
    console.log(" ")

    _getThreads()
  }

  useLiuWatch(spaceIdRef, _getColumns)
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
