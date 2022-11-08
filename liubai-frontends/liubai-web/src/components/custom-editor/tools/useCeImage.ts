import { inject, onActivated, onDeactivated, Ref, ref, watch } from "vue"
import type { ImageShow } from "../../../types"
import imgHelper from "../../../utils/images/img-helper"
import liuUtil from "../../../utils/liu-util"
import { mvFileKey } from "../../../utils/provide-keys"

export function useCeImage() {
  const selectImagesEl = ref<HTMLInputElement | null>(null)
  const covers = ref<ImageShow[]>([])

  const dropFiles = inject(mvFileKey)
  watch(() => dropFiles?.value, async (files) => {
    console.log("dropFiles 改变了............")
    if(!files?.length) return
    console.log("接收到掉落的文件............")
    console.log(files)
    await handleFiles(covers, files)
    if(!dropFiles?.value) return
    dropFiles.value = []
  })

  listenDocumentPaste(covers)

  const onImageChange = async () => {
    const el = selectImagesEl.value
    if(!el) return
    if(!el.files || !el.files.length) return
    const files = liuUtil.getArrayFromFileList(el.files)
    handleFiles(covers, files)
  }

  const onClearCover = (index: number) => {
    const list = covers.value
    const item = list[index]
    if(!item) return
    list.splice(index, 1)
  }

  return { 
    selectImagesEl, 
    onImageChange, 
    covers, 
    onClearCover,
  }
}

// 全局监听 "黏贴事件"
function listenDocumentPaste(
  covers: Ref<ImageShow[]>
) {
  const whenPaste = (e: ClipboardEvent) => {
    const fileList = e.clipboardData?.files
    if(!fileList || fileList.length < 1) return
    const fileArr: File[] = []
    for(let i=0; i<fileList.length; i++) {
      const v = fileList[i]
      fileArr.push(v)
    }
    handleFiles(covers, fileArr)
  }
  
  onActivated(() => {
    document.addEventListener("paste", whenPaste)
  })

  onDeactivated(() => {
    document.removeEventListener("paste", whenPaste)
  })
}


async function handleFiles(
  covers: Ref<ImageShow[]>,
  files: File[],
) {
  const imgFiles = liuUtil.getOnlyImageFiles(files)
  if(imgFiles.length < 1) return

  const res = await imgHelper.compress(imgFiles)
  const res2 = await imgHelper.getMetaDataFromFiles(res)
  const res3 = liuUtil.createObjURLs(res)
  res3.forEach((v, i) => {
    const v2 = res2[i]
    const obj: ImageShow = {
      src: v,
      id: "local_" + v2.id,
      width: v2.width,
      height: v2.height,
      h2w: v2.h2w,
    }
    covers.value.push(obj)
  })
}