import { inject, watch, ref, onMounted, onUnmounted } from "vue"
import { vcFileKey, mvFileKey, popupFileKey } from "~/utils/provide-keys"
import type { CeCtx, CeProps } from "./types"
import liuUtil from "~/utils/liu-util"
import type { 
  ImageShow, 
  LiuFileStore, 
  LiuImageStore 
} from "~/types"
import imgHelper from "~/utils/files/img-helper"
import cui from "~/components/custom-ui"
import valTool from "~/utils/basic/val-tool"
import ider from "~/utils/basic/ider"
import limit from "~/utils/limit"
import { viewFile } from "~/utils/other/view-file"

export function useCommentFile(
  props: CeProps,
  ctx: CeCtx,
) {
  
  const covers = ref<ImageShow[]>([])
  
  let located = props.located
  if(located === "main-view") {
    // 监听从 main-view 里掉落的文件
    listenFilesFromMainView(ctx)
  }
  else if(located === "vice-view") {
    // 监听从 vice-content 里掉落的文件
    listenFilesFromViceContent(ctx, props)
  }
  else if(located === "popup") {
    // 监听从 popup 里掉落的文件
    listenFilesFromPopup(ctx)
  }

  // 监听黏贴
  listenDocumentPaste(ctx, props)

  // 监听逻辑数据改变，去响应视图
  watch(() => ctx.images, (newImages) => {
    imgHelper.whenImagesChanged(covers, newImages)
  }, { deep: true })

  // editing-covers 传来用户拖动图片，调整了顺序
  // 开始对 "逻辑数据" 排序，这样视图数据 covers 就会在上方的 watch 响应
  const onCoversSorted = (newCovers: ImageShow[]) => {
    whenCoversSorted(newCovers, ctx)
  }

  const onImageChange = (files: File[]) => {
    handleFiles(ctx, files)
  }

  const onClearCover = (index: number) => {
    const list = ctx.images
    if(!list) return
    const item = list[index]

    if(!item) return
    list.splice(index, 1)
  }

  // 接收 来自 more-area 用户选择/移除 文件的响应
  const onFileChange = (files: File[]) => {
    whenFileChange(ctx, files)
  }

  const onViewFile = () => {
    const f = ctx.files[0]
    if(!f) return
    viewFile(f)
  }

  const onClearFile = () => {
    ctx.files = []
  }


  return {
    covers,
    onClearCover,
    onCoversSorted,
    onFileChange,
    onImageChange,
    onViewFile,
    onClearFile,
  }
}

function whenFileChange(
  ctx: CeCtx,
  files: File[] | null
) {
  if(!files || files.length < 1) {
    return
  }
  handleOtherFiles(ctx, files)
}

async function handleFiles(
  ctx: CeCtx,
  files: File[],
) {
  const imgFiles = liuUtil.getOnlyImageFiles(files)
  if(imgFiles.length > 0) {
    handleImages(ctx, imgFiles)
  }

  const otherFiles = liuUtil.getNotImageFiles(files)
  if(otherFiles.length > 0) {
    handleOtherFiles(ctx, files)
  }
}

async function handleOtherFiles(
  ctx: CeCtx,
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
  const maxMB = limit.getLimit("file_capacity")
  const maxSize = maxMB * MB
  if(maxSize > 0 && firstFile.size > maxSize) {
    limit.handleLimited("file_capacity", maxMB)
    return
  }

  ctx.files = fileList
  ctx.isToolbarTranslateY = false
}

async function handleImages(
  ctx: CeCtx,
  imgFiles: File[],
) {
  const hasLength = ctx.images.length
  let max_pic_num = limit.getLimit("comment_img")
  if(max_pic_num <= 0) max_pic_num = 9
  const canPushNum = max_pic_num - hasLength
  if(canPushNum <= 0) {
    limit.handleLimited("comment_img", max_pic_num)
    return
  }

  const res0 = await imgHelper.extractExif(imgFiles)
  const res = await imgHelper.compress(imgFiles)
  const res2 = await imgHelper.getMetaDataFromFiles(res, res0)
  
  res2.forEach((v, i) => {
    if(i < canPushNum) ctx.images.push(v)
  })

  // 有数据之后，让 isToolbarTranslateY 变成 false
  ctx.isToolbarTranslateY = false
}

function whenCoversSorted(
  newCovers: ImageShow[],
  ctx: CeCtx,
) {
  const oldImages = ctx.images
  const newImages: LiuImageStore[] = []
  for(let i=0; i<newCovers.length; i++) {
    const id = newCovers[i].id
    const data = oldImages.find(v => v.id === id)
    if(data) newImages.push(data)
  }
  ctx.images = newImages
}

function listenDocumentPaste(
  ctx: CeCtx,
  props: CeProps,
) {
  const whenPaste = (e: ClipboardEvent) => {
    if(!ctx.focused) return
    if(!props.isShowing) return
    const fileList = e.clipboardData?.files
    if(!fileList || fileList.length < 1) return
    const files = liuUtil.getArrayFromFileList(fileList)
    handleFiles(ctx, files)
  }

  onMounted(() => {
    document.addEventListener("paste", whenPaste)
  })

  onUnmounted(() => {
    document.removeEventListener("paste", whenPaste)
  })
}


function listenFilesFromMainView(
  ctx: CeCtx
) {
  const dropFiles = inject(mvFileKey)
  watch(() => dropFiles?.value, async (newV) => {
    if(!newV?.length) return
    await handleFiles(ctx, newV)
    if(!dropFiles?.value) return
    dropFiles.value = []
  })
}

function listenFilesFromViceContent(
  ctx: CeCtx,
  props: CeProps,
) {
  const dropFiles = inject(vcFileKey)
  watch(() => dropFiles?.value, async (newV) => {
    if(!newV?.length) return
    if(!props.isShowing) return

    await handleFiles(ctx, newV)
    if(!dropFiles?.value) return
    dropFiles.value = []
  })
}

function listenFilesFromPopup(
  ctx: CeCtx
) {
  const dropFiles = inject(popupFileKey)
  watch(() => dropFiles?.value, async (newV) => {
    if(!newV?.length) return
    await handleFiles(ctx, newV)
    if(!dropFiles?.value) return
    dropFiles.value = []
  })

}