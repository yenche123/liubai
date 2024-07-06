import { computed } from "vue"
import type { PrettyFileProps, PrettyFileIcon, PrettyFileEmit } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import { checkFile } from "~/utils/files/checkFile"

export function usePrettyFile(
  props: PrettyFileProps,
  emit: PrettyFileEmit,
) {

  const rr = useRouteAndLiuRouter()

  const {
    iconType,
    sizeStr,
  } = initSomeVals(props)

  const onTapFile = () => {
    const f = props.file
    if(!f) return
    checkFile(f, rr)
    emit("aftertapfile")
  }
  

  return {
    iconType,
    sizeStr,
    onTapFile,
  }
}


// 初始化一些值
function initSomeVals(props: PrettyFileProps) {

  // 目前有的文件 icon: "word" / "excel" / "pdf" / "text" /  "attachment" / ""
  const iconType = computed<PrettyFileIcon>(() => {
    const f = props.file
    if(!f) return ""
    const s = f.suffix.toLowerCase()
    const m = f.mimeType

    if(m.indexOf("image") === 0) return "photo"
    if(m.indexOf("video") === 0) return "video"
    if(s === "doc" || s === "docx") return "word"
    if(s === "xls" || s === "xlsx" || s === "csv") return "excel"
    if(s === "ppt" || s === "pptx") return "ppt"
    if(s === "pdf") return "pdf"
    if(s === "txt") return "text"
    if(s === "psd") return "psd"
    return "attachment"
  })

  // 显示文件大小
  const sizeStr = computed(() => {
    const f = props.file
    if(!f) return ""
    const size = f.size
    if(!size) return ""
    if(size < 1024) return `${size} B`
    const kb = Math.round(size / 1024)
    if(kb < 1024) return `${kb} kB`

    let tmpStr = ""
    const mb = kb / 1024
    if(mb < 10) {
      tmpStr = mb.toFixed(1)
      return `${tmpStr} MB`
    }
    if(mb < 1024) {
      tmpStr = mb.toFixed(0)
      return `${tmpStr} MB`
    }

    const gb = mb / 1024
    if(gb < 3) {
      tmpStr = gb.toFixed(2)
      return `${tmpStr} GB`
    }
    if(gb < 10) {
      tmpStr = gb.toFixed(1)
      return `${tmpStr} GB`
    }
    tmpStr = gb.toFixed(0)
    return `${tmpStr} GB`
  })


  return {
    iconType,
    sizeStr,
  }
}


