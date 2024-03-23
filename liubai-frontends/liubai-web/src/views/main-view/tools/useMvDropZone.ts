import { provide, ref, watch } from "vue";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { useDropZone, usePageLeave } from "~/hooks/useVueUse"
import { mvFileKey } from "~/utils/provide-keys"
import type { MainViewProps } from "./types"
import time from "~/utils/basic/time";

export function useMvDropZone(
  props: MainViewProps
) {
  const hasLeftPage = usePageLeave()

  const centerRef = ref<HTMLDivElement>()
  const dropFiles = ref<File[]>([])
  provide(mvFileKey, dropFiles)

  const globalState = useGlobalStateStore()

  const onDrop = (files: File[] | null) => {
    if(globalState.isDragToSort || !props.dropFiles) {
      return
    }
    // console.log("onDrop..........")
    // console.log(files)
    // console.log(" ")
    if(files?.length) dropFiles.value = files 
  }

  const { isOverDropZone } = useDropZone(centerRef, onDrop)
  
  const isCursorInWindow = ref(false)
  let lastCiwChangeStamp = 0
  watch(hasLeftPage, (newV) => {
    lastCiwChangeStamp = time.getTime()
    isCursorInWindow.value = !newV
  })

  // 不直接回传 isOverDropZone，而是套一层 _isOverDropZone
  // 为了考量 全局状态 isDragToSort (内部是否正在拖动以排序图片)
  const _isOverDropZone = ref(isOverDropZone.value)   
  watch(isOverDropZone, (newV) => {
    if(globalState.isDragToSort) return

    // 当前鼠标若在窗口内
    if(isCursorInWindow.value) {
      // 并且 hasLeftPage 变化的状态已经超过了 200ms
      if(!time.isWithinMillis(lastCiwChangeStamp, 150)) {
        return
      }
    }

    _isOverDropZone.value = newV
  })

  const onTapCenterDropZone = () => {
    _isOverDropZone.value = false
  }

  return { 
    centerRef, 
    isOverDropZone: _isOverDropZone,
    onTapCenterDropZone,
  }
}