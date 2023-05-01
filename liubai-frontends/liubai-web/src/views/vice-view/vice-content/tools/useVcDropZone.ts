import { ref, computed, Ref } from "vue"
import type { PageState } from "~/types/types-atom";
import type { VcState, VcCtx, VcProps } from "./types"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { storeToRefs } from "pinia";
import { useDropZone } from "~/hooks/useVueUse"

export function useVcDropZone(
  vcState: Ref<VcState>,
  props: VcProps,
) {

  const contentRef = ref<HTMLDivElement>()
  const threadDetailState = ref<PageState>(0)
  const onTdStateChange = (newV: PageState) => {
    threadDetailState.value = newV
  }

  const gStore = useGlobalStateStore()
  const { isDragToSort } = storeToRefs(gStore)

  const onDrop = (files: File[] | null) => {
    console.log("监听到 files 掉落")
    console.log(files)
    console.log(" ")
  }

  const { isOverDropZone } = useDropZone(contentRef, onDrop)

  const showDropZone = computed(() => {
    // 当前 vice-content 不是承载 thread 时，返回 false
    if(vcState.value !== "thread") return false

    if(props.isOutterDraging) return false

    // 当前 thread 不是正常状态，返回 false
    if(threadDetailState.value !== -1) return false

    // 当前全局状态是 kanban-page / list-page 里有 item 正在被拖动吗？
    if(isDragToSort.value) return false

    return isOverDropZone.value
  })

  return {
    onTdStateChange,
    contentRef,
    showDropZone,
  }

}