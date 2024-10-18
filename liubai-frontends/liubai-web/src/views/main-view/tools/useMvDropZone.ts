import { 
  provide, 
  ref, watch, 
  useTemplateRef, 
  type ShallowRef, 
  type Ref,
} from "vue";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { useDropZone } from "~/hooks/useVueUse"
import { mvFileKey } from "~/utils/provide-keys"
import type { MainViewProps } from "./types"

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

  const dropFiles = ref<File[]>([])
  provide(mvFileKey, dropFiles)

  const globalState = useGlobalStateStore()

  const onDrop = (files: File[] | null) => {
    if(globalState.isDragToSort) {
      return
    }
    if(files?.length) dropFiles.value = files 
  }

  const { isOverDropZone } = useDropZone(centerRef, {
    dataTypes: (types) => {
      const len = types.length ?? 0
      return len > 0
    },
    onDrop,
  })

  // 不直接回传 isOverDropZone，而是套一层 _isOverDropZone
  // 为了考量 全局状态 isDragToSort (内部是否正在拖动以排序图片)
  
  watch(isOverDropZone, (newV) => {
    if(globalState.isDragToSort) return
    _isOverDropZone.value = newV
  })
}