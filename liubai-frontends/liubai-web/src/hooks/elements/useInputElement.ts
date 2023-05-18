import { ref } from "vue"
import liuUtil from "~/utils/liu-util"

export type InputElementCallback = (
  files: File[],
  el: HTMLInputElement,
) => void

export function useInputElement(
  onNewFiles: InputElementCallback
) {
  
  const inputEl = ref<HTMLInputElement | null>(null)

  const onFileChange = () => {
    const el = inputEl.value
    if(!el) return
    if(!el.files || !el.files.length) return
    const files = liuUtil.getArrayFromFileList(el.files)
    onNewFiles(files, el)
  }

  const onTapChooseFile = () => {
    const el = inputEl.value
    if(!el) return
    el.click()
  } 


  return {
    inputEl,
    onFileChange,
    onTapChooseFile,
  }
}