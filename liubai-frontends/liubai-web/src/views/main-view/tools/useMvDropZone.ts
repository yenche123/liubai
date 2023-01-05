import { provide, ref, watch, watchEffect } from "vue";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { useDropZone } from "~/hooks/useVueUse"
import { mvFileKey } from "~/utils/provide-keys"

export function useMvDropZone() {
  const centerRef = ref<HTMLDivElement>()
  const dropFiles = ref<File[]>()
  provide(mvFileKey, dropFiles)

  const globalState = useGlobalStateStore()

  const onDrop = (files: File[] | null) => {
    if(globalState.isDragToSort) {
      return
    }
    // console.log("onDrop..........")
    // console.log(files)
    // console.log(" ")
    if(files?.length) dropFiles.value = files 
  }

  const { isOverDropZone } = useDropZone(centerRef, onDrop)

  // 不直接回传 isOverDropZone，而是套一层 _isOverDropZone
  // 为了考量 全局状态 isDragToSort (内部是否正在拖动以排序图片)
  const _isOverDropZone = ref(isOverDropZone.value)   
  watch(isOverDropZone, (newV) => {
    if(globalState.isDragToSort) return
    _isOverDropZone.value = newV
  })

  return { centerRef, isOverDropZone: _isOverDropZone }
}