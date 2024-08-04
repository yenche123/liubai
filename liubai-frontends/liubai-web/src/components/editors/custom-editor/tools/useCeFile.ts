import { inject, onDeactivated, ref, watch, type Ref } from "vue"
import type { ImageShow, LiuFileStore, LiuImageStore } from "~/types"
import imgHelper from "~/utils/files/img-helper"
import liuUtil from "~/utils/liu-util"
import { mvFileKey } from "~/utils/provide-keys"
import type { CeData } from "./types"
import cui from "~/components/custom-ui"
import valTool from "~/utils/basic/val-tool"
import ider from "~/utils/basic/ider"
import limit from "~/utils/limit"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { onLiuActivated } from "~/hooks/useCommon"

export function useCeFile(
  ceData: CeData,
) {
  const covers = ref<ImageShow[]>([])

  // 监听文件拖动掉落
  listenFilesDrop(ceData)

  // 监听文件黏贴上来
  listenDocumentPaste(ceData)

  // 监听逻辑数据改变，去响应视图
  watch(() => ceData.images, (newImages) => {
    imgHelper.whenImagesChanged(covers, newImages)
  }, { deep: true })

  // editing-covers 传来用户拖动图片，调整了顺序
  // 开始对 "逻辑数据" 排序，这样视图数据 covers 就会在上方的 watch 响应
  const onCoversSorted = (newCovers: ImageShow[]) => {
    whenCoversSorted(newCovers, ceData)
  }

  const onImageChange = (files: File[]) => {
    handleFiles(ceData, files)
  }

  const onClearCover = (index: number) => {
    const list = ceData.images
    if(!list) return
    const item = list[index]

    if(!item) return
    list.splice(index, 1)
  }

  // 接收 来自 more-area 用户选择/移除 文件的响应
  const onFileChange = (files: File[] | null) => {
    whenFileChange(ceData, files)
  }

  return { 
    onImageChange, 
    covers, 
    onClearCover,
    onCoversSorted,
    onFileChange,
  }
}

function whenFileChange(
  ceData: CeData,
  files: File[] | null
) {
  if(!files || files.length < 1) {
    if(ceData.files) delete ceData.files
    return
  }

  handleOtherFiles(ceData, files)
}

function whenCoversSorted(
  newCovers: ImageShow[],
  ceData: CeData,
) {
  const oldImages = ceData.images ?? []
  const newImages: LiuImageStore[] = []
  for(let i=0; i<newCovers.length; i++) {
    const id = newCovers[i].id
    const data = oldImages.find(v => v.id === id)
    if(data) newImages.push(data)
  }
  ceData.images = newImages
}

// 处理文件掉落
function listenFilesDrop(
  ceData: CeData,
) {
  const dropFiles = inject(mvFileKey)
  watch(() => dropFiles?.value, async (files) => {
    if(!files?.length) return
    console.log("listenFilesDrop 接收到掉落的文件............")
    console.log(files)
    await handleFiles(ceData, files)
    if(!dropFiles?.value) return
    dropFiles.value = []
  })
}

// 全局监听 "黏贴事件"
function listenDocumentPaste(
  ceData: CeData,
) {
  const gs = useGlobalStateStore()
  const whenPaste = (e: ClipboardEvent) => {
    if(!gs.customEditorInputing) {
      return
    }
    const fileList = e.clipboardData?.files
    if(!fileList || fileList.length < 1) return
    const files = liuUtil.getArrayFromFileList(fileList)
    handleFiles(ceData, files)
  }
  
  onLiuActivated(() => {
    document.addEventListener("paste", whenPaste)
  })

  onDeactivated(() => {
    document.removeEventListener("paste", whenPaste)
  })
}


async function handleFiles(
  ceData: CeData,
  files: File[],
) {
  const imgFiles = liuUtil.getOnlyImageFiles(files)
  if(imgFiles.length > 0) {
    handleImages(ceData, imgFiles)
  }

  const otherFiles = liuUtil.getNotImageFiles(files)
  if(otherFiles.length > 0) {
    handleOtherFiles(ceData, files)
  }
}

async function handleOtherFiles(
  ceData: CeData,
  files: File[],
) {
  const fileList: LiuFileStore[] = []
  const MB = 1024 * 1024

  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const arrayBuffer = await v.arrayBuffer()
    const suffix = valTool.getSuffix(v.name)
    const obj: LiuFileStore = {
      id: ider.createFileId(),
      name: v.name,
      lastModified: v.lastModified,
      suffix,
      size: v.size,
      mimeType: v.type,
      arrayBuffer,
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

  ceData.files = fileList
  ceData.more = true
}

async function handleImages(
  ceData: CeData,
  imgFiles: File[],
) {

  ceData.images = ceData.images ?? []
  const hasLength = ceData.images.length
  let max_pic_num = limit.getLimit("thread_img")
  if(max_pic_num <= 0) max_pic_num = 9
  const canPushNum = max_pic_num - hasLength
  if(canPushNum <= 0) {
    cui.showModal({
      title_key: "tip.tip",
      content_key: "tip.max_pic_num",
      content_opt: { num: max_pic_num },
      showCancel: false
    })
    return
  }

  const res0 = await imgHelper.extractExif(imgFiles)
  const res = await imgHelper.compress(imgFiles)
  const res2 = await imgHelper.getMetaDataFromFiles(res, res0)

  res2.forEach((v, i) => {
    if(i < canPushNum) ceData.images?.push(v)
  })

}