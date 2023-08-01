import { ref, computed, provide } from "vue";
import type { PageState } from "~/types/types-atom";
import type { VcProps, VcData } from "./types"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { storeToRefs } from "pinia";
import { useDropZone, usePageLeave } from "~/hooks/useVueUse"
import { vcFileKey } from "~/utils/provide-keys"

export function useVcDropZone(
  vcData: VcData,
  props: VcProps,
) {
  const hasLeftPage = usePageLeave()

  const containerRef = ref<HTMLDivElement>()
  const viewState = ref<PageState>(0)
  const onViewStateChange = (newV: PageState) => {
    viewState.value = newV
  }

  const gStore = useGlobalStateStore()
  const { isDragToSort } = storeToRefs(gStore)
  const dropFiles = ref<File[]>([])
  provide(vcFileKey, dropFiles)

  const onDrop = (files: File[] | null) => {
    if(gStore.isDragToSort) return
    if(files?.length) dropFiles.value = files 
  }

  const { isOverDropZone } = useDropZone(containerRef, onDrop)

  const showDropZone = computed(() => {
    // 当前 vice-content 不是承载 thread 时，返回 false
    const current = vcData.currentState
    if(current !== "thread" && current !== "comment") return false

    if(props.isOutterDraging) return false

    // 当前 thread 不是正常状态，返回 false
    if(viewState.value !== -1) return false

    // 当前全局状态是 kanban-page / list-page 里有 item 正在被拖动吗？
    if(isDragToSort.value) return false

    // 当前鼠标是否已离开页面，若不是，则忽略
    if(!hasLeftPage.value) return false

    return isOverDropZone.value
  })

  return {
    onViewStateChange,
    containerRef,
    showDropZone,
  }

}