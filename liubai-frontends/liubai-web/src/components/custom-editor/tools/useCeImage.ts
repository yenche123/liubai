import { inject, onActivated, onDeactivated, Ref, ref, toRef, watch, watchEffect } from "vue"
import type { ImageLocal, ImageShow } from "../../../types"
import imgHelper from "../../../utils/images/img-helper"
import liuUtil from "../../../utils/liu-util"
import { mvFileKey } from "../../../utils/provide-keys"
import type { CeState } from "./types-ce"

export function useCeImage(
  state: CeState,
) {
  
  const selectImagesEl = ref<HTMLInputElement | null>(null)
  const covers = ref<ImageShow[]>([])

  // 监听逻辑数据改变，去响应视图
  watch(() => state.images, (newImages) => {
    whenImagesChanged(covers, newImages)
  }, { deep: true })

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
    const list = state.images ?? []
    const item = list[index]

    console.log("onClearCover.........")
    console.log("index: ", index)
    console.log("item: ", item)
    console.log(" ")

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


function whenImagesChanged(
  coversRef: Ref<ImageShow[]>,
  newImages?: ImageLocal[],
) {
  console.log("whenImagesChanged..............")
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
  if(imgFiles.length < 1) return

  const res = await imgHelper.compress(imgFiles)
  const res2 = await imgHelper.getMetaDataFromFiles(res)
  state.images = state.images ?? []
  res2.forEach(v => {
    state.images?.push(v)
  })
}