import { computed, provide, useTemplateRef } from "vue";
import { storeToRefs } from "pinia";
import { popupFileKey } from "~/utils/provide-keys"
import type { CommentPopupData } from "./types"
import { useLiuDropZone } from "~/hooks/elements/useLiuDropZone";

export function useCpDropZone(
  cpData: CommentPopupData
) {
  const containerRef = useTemplateRef<HTMLDivElement>("containerRef")
  const {
    gStore,
    isOverDropZone,
    dropFiles,
  } = useLiuDropZone(containerRef)
  const { isDragToSort } = storeToRefs(gStore)
  provide(popupFileKey, dropFiles)

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