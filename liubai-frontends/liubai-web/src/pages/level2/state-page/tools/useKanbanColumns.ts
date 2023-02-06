import { computed, reactive } from "vue";
import type { KanbanColumn, ThreadShow } from "~/types/types-content";
import type { 
  ColumnInsertData,
  KanbanEmits, 
  KanbanProps,
} from "./types";
import stateController from "~/utils/controllers/state-controller/state-controller";
import { whenThreadInserted, whenThreadListUpdated } from "./handleKanbanSort"

export function useKanbanColumns(
  props: KanbanProps,
  emits: KanbanEmits
) {

  const columns = computed({
    get() {
      return props.kanbanColumns
    },
    set(val) {
      emits("update:kanbanColumns", val)
    }
  })

  const scollTops = reactive<Record<string, number>>({})
  const setScrollTop = (stateId: string, sT: number) => {
    scollTops[stateId] = sT
  }

  const onUpdateList = (e: KanbanColumn[]) => {
    const newStateIds = e.map(v => v.id)
    whenColumnsSorted(newStateIds)
  }

  const onThreadInserted = (stateId: string, data: ColumnInsertData) => {
    console.log("onThreadInserted........")
    whenThreadInserted(stateId, data.value)
  }

  return {
    columns,
    scollTops,
    setScrollTop,
    onUpdateList,
    onThreadInserted,
    onThreadsUpdated: whenThreadListUpdated,
  }
}


function whenColumnsSorted(
  newStateIds: string[]
) {
  const tmpList = stateController.getStates()
  const oldStates = tmpList.map(v => v.id)

  const _hasChange = () => {
    if(oldStates.length !== newStateIds.length) return true
    for(let i=0; i<newStateIds.length; i++) {
      const v1 = newStateIds[i]
      const v2 = oldStates[i]
      if(v1 !== v2) return true
    }
    return false
  }

  if(!_hasChange()) {
    return
  }

  console.log("次序有发生变化哦..........")

  stateController.stateListSorted(newStateIds)
}

