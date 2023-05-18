import type { CetProps, CetEmit } from "./types"
import { useInputElement } from "~/hooks/elements/useInputElement"

export function useCetInputElement(
  props: CetProps, 
  emit: CetEmit
) {
  const onNewImages = (files: File[]) => {
    emit("imagechange", files)
  }

  const {
    inputEl: selectImagesEl,
    onFileChange: onImageChange,
    onTapChooseFile: onTapChooseImage,
  } = useInputElement(onNewImages)

  return {
    selectImagesEl,
    onImageChange,
    onTapChooseImage,
  }
}