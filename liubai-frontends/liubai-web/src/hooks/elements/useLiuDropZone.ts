import { ref, type ShallowRef } from "vue"
import { useGlobalStateStore } from "../stores/useGlobalStateStore"
import liuApi from "~/utils/liu-api"
import { useDropZone } from "../useVueUse"

export function useLiuDropZone(
  divRef: ShallowRef<HTMLDivElement | null>,
) {
  const dropFiles = ref<File[]>([])
  
  const gStore = useGlobalStateStore()
  const { isSafari } = liuApi.getCharacteristic()

  const onDrop = (files: File[] | null) => {
    if(gStore.isDragToSort) {
      return
    }
    if(files?.length) dropFiles.value = files 
  }

  const { isOverDropZone } = useDropZone(divRef, {
    dataTypes: !isSafari ? (types) => {
      const len = types.length ?? 0
      return len > 0
    } : undefined,
    onDrop,
  })

  return {
    isOverDropZone,
    dropFiles,
    gStore,
  }

}