import { provide, ref, watch, watchEffect } from "vue";
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore";
import { useDropZone } from "../../../hooks/useVueUse"
import { mvFileKey } from "../../../utils/provide-keys"

export function useMvDropZone() {
  const centerRef = ref<HTMLDivElement>()
  const dropFiles = ref<File[]>()
  provide(mvFileKey, dropFiles)

  const globalState = useGlobalStateStore()

  const onDrop = (files: File[] | null) => {
    if(globalState.isDragToSort) return
    if(files?.length) dropFiles.value = files 
  }

  const { isOverDropZone } = useDropZone(centerRef, onDrop)
  // 套一层，为了考量 全局状态 isDragToSort (内部是否正在拖动以排序图片)
  const _isOverDropZone = ref(isOverDropZone.value)   

  watch(isOverDropZone, (newV) => {
    if(globalState.isDragToSort) return
    _isOverDropZone.value = newV
  })

  return { centerRef, isOverDropZone: _isOverDropZone }
}