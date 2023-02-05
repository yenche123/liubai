import { computed, reactive } from "vue";
import type { KanbanEmits, KanbanProps } from "./types";

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
  
  return {
    columns,
    scollTops,
    setScrollTop,
  }
}

