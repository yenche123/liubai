import { useGlobalStateStore } from "../../../../hooks/stores/useGlobalStateStore"

export function useCeCovers() {

  const globalStore = useGlobalStateStore()

  const onDragStart = () => {
    globalStore.isDragToSort = true
  }
  
  const onDragEnd = () => {
    globalStore.isDragToSort = false
  }

  return {
    onDragStart,
    onDragEnd,
  }
}