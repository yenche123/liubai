import { inject, onActivated, onDeactivated, ref, watch } from "vue"
import type { FileLocal, ImageLocal, ImageShow } from "../../../types"
import imgHelper from "../../../utils/images/img-helper"
import liuUtil from "../../../utils/liu-util"
import { mvFileKey } from "../../../utils/provide-keys"
import type { CeState } from "./types-ce"
import type { Ref } from "vue"
import cui from "../../custom-ui"
import valTool from "../../../utils/basic/val-tool"
import ider from "../../../utils/basic/ider"

export function useCeFile(
  state: CeState,
) {
  
  const selectImagesEl = ref<HTMLInputElement | null>(null)
  const covers = ref<ImageShow[]>([])

  // 监听逻辑数据改变，去响应视图
  watch(() => state.images, (newImages) => {
    whenImagesChanged(covers, newImages)
  }, { deep: true })

  // ce-covers 传来用户拖动图片，调整了顺序
  // 开始对 "逻辑数据" 排序，这样视图数据 covers 就会在上方的 watch 响应
  const onCoversSorted = (newCovers: ImageShow[]) => {
    whenCoversSorted(newCovers, state)
  }

  // 监听文件拖动掉落
  const dropFiles = inject(mvFileKey)
  watch(() => dropFiles?.value, async (files) => {
    if(!files?.length) return
    console.log("接收到掉落的文件............")
    console.log(files)
    await handleFiles(state, files)
    if(!dropFiles?.value) return
    dropFiles.value = []
  })

  // 监听文件黏贴上来
  listenDocumentPaste(state)

  const onImageChange = (files: File[]) => {
    handleFiles(state, files)
  }

  const onClearCover = (index: number) => {
    const list = state.images
    if(!list) return
    const item = list[index]

    if(!item) return
    list.splice(index, 1)
  }

  // 接收 来自 more-area 用户选择/移除 文件的响应
  const onFileChange = (files: File[] | null) => {
    whenFileChange(state, files)
  }

  return { 
    selectImagesEl, 
    onImageChange, 
    covers, 
    onClearCover,
    onCoversSorted,
    onFileChange,
  }
}

function whenFileChange(
  state: CeState,
  files: File[] | null
) {
  if(!files || files.length < 1) {
    if(state.files) delete state.files
    return
  }

  handleOtherFiles(state, files)
}

function whenCoversSorted(
  newCovers: ImageShow[],
  state: CeState,
) {
  const oldImages = state.images ?? []
  const newImages: ImageLocal[] = []
  for(let i=0; i<newCovers.length; i++) {
    const id = newCovers[i].id
    const data = oldImages.find(v => v.id === id)
    if(data) newImages.push(data)
  }
  state.images = newImages
}

function whenImagesChanged(
  coversRef: Ref<ImageShow[]>,
  newImages?: ImageLocal[],
) {
  const newLength = newImages?.length ?? 0
  if(newLength < 1) {
    if(coversRef.value.length > 0) coversRef.value = []
    return
  }

  (newImages as ImageLocal[]).forEach((v, i) => {
    const v2 = coversRef.value[i]
    if(!v2) {
      coversRef.value.push(imgHelper.imageLocalToShow(v))
    }
    else if(v2.id !== v.id) {
      coversRef.value[i] = imgHelper.imageLocalToShow(v)
    }
  })

  // 删除多余的项
  const length2 = coversRef.value.length
  const diffLength = length2 - newLength
  if(diffLength > 0) {
    coversRef.value.splice(newLength, diffLength)
  }
}


// 全局监听 "黏贴事件"
function listenDocumentPaste(
  state: CeState
) {
  const whenPaste = (e: ClipboardEvent) => {
    const fileList = e.clipboardData?.files
    if(!fileList || fileList.length < 1) return
    const files = liuUtil.getArrayFromFileList(fileList)
    handleFiles(state, files)
  }
  
  onActivated(() => {
    document.addEventListener("paste", whenPaste)
  })

  onDeactivated(() => {
    document.removeEventListener("paste", whenPaste)
  })
}


async function handleFiles(
  state: CeState,
  files: File[],
) {
  const imgFiles = liuUtil.getOnlyImageFiles(files)
  if(imgFiles.length > 0) {
    handleImages(state, imgFiles)
  }

  const otherFiles = liuUtil.getNotImageFiles(files)
  if(otherFiles.length > 0) {
    handleOtherFiles(state, files)
  }
}

function handleOtherFiles(
  state: CeState,
  files: File[],
) {
  const fileList: FileLocal[] = []
  const MB = 1024 * 1024

  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const suffix = valTool.getSuffix(v.name)
    const obj: FileLocal = {
      id: ider.createFileId(),
      name: v.name,
      lastModified: v.lastModified,
      suffix,
      size: v.size,
      file: v,
    }
    fileList.push(obj)
  }

  const firstFile = fileList[0]
  if(!firstFile) return
  if(firstFile.size > 10 * MB) {
    cui.showModal({
      title_key: "tip.file_exceed_title",
      content_key: "tip.file_exceed_content",
      showCancel: false
    })
    return
  }

  state.files = fileList
}

async function handleImages(
  state: CeState,
  imgFiles: File[],
) {

  const res = await imgHelper.compress(imgFiles)
  const res2 = await imgHelper.getMetaDataFromFiles(res)
  state.images = state.images ?? []
  res2.forEach(v => {
    state.images?.push(v)
  })

}