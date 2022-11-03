import { provide, ref, watch, watchEffect } from "vue";
import { useDropZone } from "../../../hooks/useVueUse"
import { mvFileKey } from "../../../utils/provide-keys"

export function useMvDropZone() {
  const centerRef = ref<HTMLDivElement>()
  const dropFiles = ref<File[]>()
  provide(mvFileKey, dropFiles)

  const onDrop = (files: File[] | null) => {
    if(files?.length) dropFiles.value = files 
  }

  const { isOverDropZone } = useDropZone(centerRef, onDrop)
  watch(isOverDropZone, (newV) => {
    console.log("isOverDropZone newV: ")
    console.log(newV)
  })

  return { centerRef, isOverDropZone }
}