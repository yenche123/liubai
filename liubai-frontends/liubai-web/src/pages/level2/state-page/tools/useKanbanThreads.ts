import { computed } from "vue";
import type { KbListEmits, KbListProps } from "./types";

export function useKanbanThreads(
  props: KbListProps,
  emits: KbListEmits
) {

  const list = computed({
    get() {
      return props.threads
    },
    set(val) {
      emits("update:threads", val)
    }
  })
  
  return {
    list,
  }
}

