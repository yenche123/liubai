import { ref } from "vue"
import liuUtil from "~/utils/liu-util"

export function useImportContent() {

  const oursFileEl = ref<HTMLInputElement | null>(null)


  const onOursFileChange = () => {
    const el = oursFileEl.value
    if(!el) return
    if(!el.files || !el.files.length) return
    const files = liuUtil.getArrayFromFileList(el.files)
    console.log("files: ")
    console.log(files)
    console.log(" ")

  }


  return {
    oursFileEl,
    onOursFileChange,
  }
}