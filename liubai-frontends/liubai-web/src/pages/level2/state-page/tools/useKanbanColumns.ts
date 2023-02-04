import { computed } from "vue";
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
  
  return {
    columns,
  }
}

