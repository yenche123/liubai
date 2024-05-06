import { ref, computed, provide } from "vue";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { storeToRefs } from "pinia";
import { useDropZone } from "~/hooks/useVueUse"
import { popupFileKey } from "~/utils/provide-keys"
import type { CommentPopupData } from "./types"

export function useCpDropZone(
  cpData: CommentPopupData
) {
  const containerRef = ref<HTMLDivElement>()
  const gStore = useGlobalStateStore()
  const { isDragToSort } = storeToRefs(gStore)

  const dropFiles = ref<File[]>([])
  provide(popupFileKey, dropFiles)

  const onDrop = (files: File[] | null) => {
    if(gStore.isDragToSort) return
    if(files?.length) dropFiles.value = files 
  }

  const { isOverDropZone } = useDropZone(containerRef, onDrop)

  const showDropZone = computed(() => {
    // 当前全局状态是否存在 
    // kanban-view / list-view 里有 item 正在被拖动吗？
    if(isDragToSort.value) return false
    return isOverDropZone.value
  })

  return {
    containerRef,
    showDropZone,
  }

}