import { computed, reactive } from "vue";
import type { KanbanColumn } from "~/types/types-content";
import type { KanbanEmits, KanbanProps } from "./types";
import stateController from "~/utils/controllers/state-controller/state-controller";

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

  
  return {
    columns,
    scollTops,
    setScrollTop,
    onUpdateList
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
    console.log("没有发生改变啦！")
    return
  }

  console.log("次序有发生变化哦..........")

  stateController.stateListSorted(newStateIds)
}

