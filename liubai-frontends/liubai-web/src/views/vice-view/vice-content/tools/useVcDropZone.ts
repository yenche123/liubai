import { ref, computed, provide, useTemplateRef } from "vue";
import type { PageState } from "~/types/types-atom";
import type { VcProps, VcData } from "./types"
import { storeToRefs } from "pinia";
import { vcFileKey } from "~/utils/provide-keys"
import { pageStates } from "~/utils/atom";
import { useLiuDropZone } from "~/hooks/elements/useLiuDropZone";

export function useVcDropZone(
  vcData: VcData,
  props: VcProps,
) {
  const containerRef = useTemplateRef<HTMLDivElement>("containerRef")
  const viewState = ref<PageState>(pageStates.LOADING)
  const onViewStateChange = (newV: PageState) => {
    viewState.value = newV
  }

  const {
    gStore,
    isOverDropZone,
    dropFiles,
  } = useLiuDropZone(containerRef)
  const { isDragToSort } = storeToRefs(gStore)
  provide(vcFileKey, dropFiles)

  const showDropZone = computed(() => {
    // 当前 vice-content 不是承载 thread 时，返回 false
    const current = vcData.currentState
    if(current !== "thread" && current !== "comment") return false

    if(props.isOutterDraging) return false

    // 当前 thread 不是正常状态，返回 false
    if(viewState.value !== pageStates.OK) return false

    // 当前全局状态是否存在 状态页中 
    // kanban-view / list-view 里有 item 正在被拖动吗？
    if(isDragToSort.value) return false

    return isOverDropZone.value
  })

  return {
    onViewStateChange,
    containerRef,
    showDropZone,
  }

}