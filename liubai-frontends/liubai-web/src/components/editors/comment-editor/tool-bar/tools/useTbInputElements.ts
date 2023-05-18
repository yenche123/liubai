import type { ToolBarProps, ToolBarEmits } from "./types"
import { ref } from "vue"
import liuUtil from "~/utils/liu-util"
import { useInputElement } from "~/hooks/elements/useInputElement"

export function useTbInputElements(
  props: ToolBarProps,
  emit: ToolBarEmits,
) {

  const onNewImage = (files: File[]) => {
    emit("imagechange", files)
  }

  const onNewFile = (files: File[], el: HTMLInputElement) => {
    emit("filechange", files)
    el.blur()
  }

  const {
    inputEl: selectImagesEl,
    onFileChange: onImageChange,
    onTapChooseFile: onTapImage,
  } = useInputElement(onNewImage)

  const {
    inputEl: selectFileEl,
    onFileChange: onFileChange,
    onTapChooseFile: onTapFile,
  } = useInputElement(onNewFile)

  return {
    selectImagesEl,
    onImageChange,
    onTapImage,
    selectFileEl,
    onFileChange,
    onTapFile,
  }

}