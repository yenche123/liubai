import { computed, inject, reactive } from "vue";
import type { KanbanColumn, ThreadShow } from "~/types/types-content";
import type { 
  ColumnInsertData,
  KanbanEmits, 
  KanbanProps,
} from "./types";
import stateController from "~/utils/controllers/state-controller/state-controller";
import { whenThreadInserted, whenThreadListUpdated } from "./handleKanbanSort"
import { kanbanInnerChangeKey } from "~/utils/provide-keys"
import time from "~/utils/basic/time";
import { MenuItem } from "~/components/common/liu-menu/tools/types";
import kanbanOperate from "./kanban-operate";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import liuUtil from "~/utils/liu-util";

const MORE_ITEMS: MenuItem[] = [
  {
    text_key: "common.edit",
    iconName: "edit_400"
  },
  {
    text_key: "common.delete",
    iconName: "delete_400"
  }
]

export function useKanbanColumns(
  props: KanbanProps,
  emits: KanbanEmits
) {
  const rr = useRouteAndLiuRouter()
  const lastInnerStampRef = inject(kanbanInnerChangeKey)

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

  const onColumnsSorted = (e: KanbanColumn[]) => {
    const newStateIds = e.map(v => v.id)
    whenColumnsSorted(newStateIds)
  }

  const _setInnerStamp = () => {
    if(!lastInnerStampRef) return
    lastInnerStampRef.value = time.getTime()
  }

  const onThreadInserted = (stateId: string, data: ColumnInsertData) => {
    _setInnerStamp()
    whenThreadInserted(stateId, data.value)
  }

  const onThreadsUpdated = (stateId: string, threads: ThreadShow[]) => {
    _setInnerStamp()
    whenThreadListUpdated(stateId, threads)
  }


  const onTapMoreMenuItem = (id: string, item: MenuItem, index: number) => {
    const textKey = item.text_key
    if(textKey === "common.edit") {
      kanbanOperate.editKanban(columns, id)
    }
    else if(textKey === "common.delete") {
      kanbanOperate.deleteKanban(columns, id)
    }
  }

  const onTapThreadItem = (id: string) => {
    liuUtil.open.openDetail(id, { rr })
  }

  const onTapAddThread = (stateId: string) => {
    kanbanOperate.addThreadToKanban(columns, stateId)
  }


  return {
    MORE_ITEMS,
    columns,
    scollTops,
    setScrollTop,
    onColumnsSorted,
    onThreadInserted,
    onThreadsUpdated,
    onTapMoreMenuItem,
    onTapThreadItem,
    onTapAddThread,
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

