import { computed, ref, watch } from "vue";
import type { KbListEmits, KbListProps } from "./types";
import type { LiuTimeout } from "~/utils/basic/type-tool";

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

  // 是否显示 "+新增"
  const showAddBox = ref(false)
  let timeout: LiuTimeout
  const _handleShowAddBox = async () => {
    const len = list.value.length
    const oldV = showAddBox.value
    if(len > 0 && !oldV) return
    if(len < 1 && oldV) return
    let newV = !oldV
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = undefined
      showAddBox.value = newV
    }, 120)
  }
  watch(list, _handleShowAddBox, { immediate: true })
  
  return {
    list,
    showAddBox,
  }
}

