import type { ToolBarProps, ToolBarEmits } from "./types"
import { ref } from "vue"
import liuUtil from "~/utils/liu-util"

export function useInputElements(
  props: ToolBarProps,
  emit: ToolBarEmits,
) {

  const selectImagesEl = ref<HTMLInputElement | null>(null)
  const selectFileEl = ref<HTMLInputElement | null>(null)
  
  const onImageChange = () => {
    const el = selectImagesEl.value
    if(!el) return
    if(!el.files || !el.files.length) return
    const files = liuUtil.getArrayFromFileList(el.files)
    emit("imagechange", files)
  }
  
  const onFileChange = () => {
    const el = selectFileEl.value
    if(!el) return
    if(!el.files || !el.files.length) return
    const files = liuUtil.getArrayFromFileList(el.files)
    emit("filechange", files)
    el.blur()
  }

  return {
    selectImagesEl,
    selectFileEl,
    onImageChange,
    onFileChange,
  }

}