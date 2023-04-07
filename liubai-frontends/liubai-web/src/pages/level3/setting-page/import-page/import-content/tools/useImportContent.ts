import { ref } from "vue"
import liuUtil from "~/utils/liu-util"
import JSZip from "jszip"
import cui from "~/components/custom-ui"

export function useImportContent() {

  const oursFileEl = ref<HTMLInputElement | null>(null)

  const onOursFileChange = () => {
    const el = oursFileEl.value
    if(!el) return
    if(!el.files || !el.files.length) return
    const files = liuUtil.getArrayFromFileList(el.files)
    const firstFile = files[0]
    if(!firstFile) return
    loadZip(firstFile)
  }

  return {
    oursFileEl,
    onOursFileChange,
  }
}

async function loadZip(f: File) {

  let results: JSZip
  try {
    results = await JSZip.loadAsync(f)
  }
  catch(err) {
    console.warn("loadAsync err: ")
    console.log(err)
    cui.showModal({ title_key: "tip.tip", content_key: "import.t4" })
    return
  }
  
  console.log("结果: ")
  results.forEach((relativePath, file) => {
    // 第二个参数 file 为 ZipObject 类型
    // 该类型有 async 方法，用来读取文件
    // 详情见: https://stuk.github.io/jszip/documentation/api_zipobject/async.html
    
    console.log(relativePath)
    console.log(file)
    console.log(" ")
  })

}
