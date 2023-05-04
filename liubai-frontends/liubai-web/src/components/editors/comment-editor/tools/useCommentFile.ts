import { inject, watch, ref } from "vue"
import { vcFileKey, mvFileKey } from "~/utils/provide-keys"
import type { CeCtx, CeProps } from "./types"
import liuUtil from "~/utils/liu-util"
import type { 
  ImageShow, 
  LiuFileStore, 
  LiuImageStore 
} from "~/types"
import imgHelper from "~/utils/images/img-helper"
import cui from "~/components/custom-ui"
import valTool from "~/utils/basic/val-tool"
import ider from "~/utils/basic/ider"
import limit from "~/utils/limit"

export function useCommentFile(
  props: CeProps,
  ctx: CeCtx,
) {
  
  const covers = ref<ImageShow[]>([])

  // 监听从 vice-content 里掉落的文件
  let located = props.located
  if(located === "main-view") {
    listenFilesFromMainView(ctx)
  }
  else if(located === "vice-view") {
    listenFilesFromViceContent(ctx)
  }
  else if(located === "popup") {
    listenFilesFromPopup(ctx)
  }


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
  const onFileChange = (files: File[] | null) => {
    whenFileChange(ctx, files)
  }


  return { 
    covers,
    onClearCover,
    onCoversSorted,
    onFileChange,
    onImageChange,
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
  if(firstFile.size > 10 * MB) {
    cui.showModal({
      title_key: "tip.file_exceed_title",
      content_key: "tip.file_exceed_content",
      showCancel: false
    })
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

  const res = await imgHelper.compress(imgFiles)
  const res2 = await imgHelper.getMetaDataFromFiles(res)

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

function listenFilesFromMainView(
  ctx: CeCtx
) {
  const dropFiles = inject(mvFileKey)
  watch(() => dropFiles?.value, async (newV) => {
    if(!newV?.length) return
    console.log("收到 main-view 掉落的文件.......")
    console.log(liuUtil.toRawData(newV))
    console.log(" ")
    await handleFiles(ctx, newV)
    if(!dropFiles?.value) return
    dropFiles.value = []
  })
}

function listenFilesFromViceContent(
  ctx: CeCtx
) {
  const dropFiles = inject(vcFileKey)
  watch(() => dropFiles?.value, async (newV) => {
    if(!newV?.length) return
    console.log("收到 vice-content 掉落的文件.......")
    console.log(liuUtil.toRawData(newV))
    console.log(" ")
    await handleFiles(ctx, newV)
    if(!dropFiles?.value) return
    dropFiles.value = []
  })
}

function listenFilesFromPopup(
  ctx: CeCtx
) {

}