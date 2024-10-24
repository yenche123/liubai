import { 
  provide, 
  ref, watch, 
  useTemplateRef, 
  type ShallowRef, 
  type Ref,
} from "vue";
import { mvFileKey } from "~/utils/provide-keys"
import type { MainViewProps } from "./types"
import { useLiuDropZone } from "~/hooks/elements/useLiuDropZone";

export function useMvDropZone(
  props: MainViewProps
) {
  const _isOverDropZone = ref(false)   
  const centerRef = useTemplateRef<HTMLDivElement>("centerRef")
  const onTapCenterDropZone = () => {
    _isOverDropZone.value = false
  }

  if(props.enableDropFiles) {
    initMvDropZone(centerRef, _isOverDropZone)
  }
  
  return { 
    centerRef, 
    isOverDropZone: _isOverDropZone,
    onTapCenterDropZone,
  }
}


function initMvDropZone(
  centerRef: ShallowRef<HTMLDivElement | null>,
  _isOverDropZone: Ref<boolean>
) {
  const {
    isOverDropZone,
    gStore,
    dropFiles,
  } = useLiuDropZone(centerRef)
  provide(mvFileKey, dropFiles)

  // 不直接回传 isOverDropZone，而是套一层 _isOverDropZone
  // 为了考量 全局状态 isDragToSort (内部是否正在拖动以排序图片)
  watch(isOverDropZone, (newV) => {
    if(gStore.isDragToSort) return
    _isOverDropZone.value = newV
  })
}