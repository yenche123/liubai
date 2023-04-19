import type { 
  ExportType, 
  GetDataOpt,
} from "./types"
import type {
  LiuExportContentJSON, LiuFileExport, LiuImageExport
} from "~/types/other/types-export"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import cfg from "~/config";
import { getData } from "./get-data"
import type { ContentLocalTable } from "~/types/types-table";
import JSZip from "jszip";
import cui from "~/components/custom-ui";
import liuUtil from "~/utils/liu-util";
import time from "~/utils/basic/time";
import { membersToShows } from "~/utils/other/member-related";
import { saveAs as fileSaverSaveAs } from 'file-saver';
import transferUtil from "~/utils/transfer-util";

export async function handleExport(
  exportType: ExportType
) {

  // 0. 获取工作区状态
  const wStore = useWorkspaceStore()
  const { spaceId, myMember } = wStore
  if(!spaceId || !myMember) return
  const [m] = membersToShows([myMember])
  
  // 1. 先去把数据 contents 加载出来
  console.time("getContents")
  const list = await getContents(spaceId)
  console.timeEnd("getContents")

  if(list.length < 1) {
    cui.showModal({ 
      title_key: "tip.tip", 
      content_key: "export.no_data", 
      showCancel: false
    })
    return
  }

  const zip = new JSZip()

  // 1. 生成 metadata
  const appName = liuUtil.getEnv().APP_NAME ?? ""
  const metadata = {
    appName,
    version: LIU_ENV.version,
    client: LIU_ENV.client,
    export_num: list.length,
    export_stamp: time.getTime(),
    operator: m.name ?? "",
  }
  zip.file("metadata.json", JSON.stringify(metadata, null, 2))


  // 2. 生成 contents 文件夹
  const contents = zip.folder("contents")
  if(!contents) {
    console.warn("构建 contents 失败..........")
    return
  }

  console.time("generate_data")
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    if(exportType === "json") {
      insertJsonContent(contents, v)
    }
    else if(exportType === "md") {
      insertMarkdownContent(contents, v)
    }
  }
  console.timeEnd("generate_data")

  console.time("resZip")
  const resZip = await zip.generateAsync({ type: "blob" })
  console.timeEnd("resZip")

  let fileName = exportType === "json" ? `${appName}-json.zip` : `${appName}-markdown.zip`

  console.time("fileSaverSaveAs")
  fileSaverSaveAs(resZip, fileName)
  console.timeEnd("fileSaverSaveAs")
}

async function insertMarkdownContent(
  contents: JSZip,
  d: ContentLocalTable,
) {
  const { theFolder, images, files } = preInsert(contents, d)
  if(!theFolder) return

  let md = transferUtil.tiptapToMarkdown(d.liuDesc ?? [], { title: d.title })

  // 添加图片
  if(images.length) {
    md += `\n`
    images.forEach(v => {
      md += `![${v.name}](./assets/${v.name})\n`
    })
  }
  // 添加文件链接
  if(files.length) {
    md += `\n`
    files.forEach(v => {
      md += `[${v.name}](./assets/${v.name})\n`
    })
  }

  theFolder.file("README.md", md)
}

function preInsert(
  contents: JSZip,
  d: ContentLocalTable,
) {
  let images: LiuImageExport[] = []
  let files: LiuFileExport[] = []

  const s = liuUtil.getLiuDate(new Date(d.createdStamp))
  const folderName = `${s.YYYY}-${s.MM}-${s.DD} ${s.hh}_${s.mm}_${s.ss}`
  const theFolder = contents.folder(folderName)
  if(!theFolder) {
    console.warn("构建 theFolder 失败..........")
    return { theFolder, files, images }
  }

  if(d.images?.length) {
    for(let i=0; i<d.images.length; i++) {
      const img = d.images[i]
      const { arrayBuffer, id, name, lastModified } = img
      if(!arrayBuffer) continue
      theFolder.file(`assets/${name}`, arrayBuffer, { date: new Date(lastModified) })

      // 去掉 img 中的 arrayBuffer 和 cloud_url 两个属性
      const { arrayBuffer: arrayBuffer2, cloud_url, ...img2 } = img
      images.push(img2)
    }
  }
  if(d.files?.length) {
    for(let i=0; i<d.files.length; i++) {
      const f = d.files[i]
      const { arrayBuffer, id, name, lastModified } = f
      if(!arrayBuffer) continue
      theFolder.file(`assets/${name}`, arrayBuffer, { date: new Date(lastModified) })

      // 去掉 f 中的 arrayBuffer 和 cloud_url 两个属性
      const { arrayBuffer: arrayBuffer2, cloud_url, ...f2 } = f
      files.push(f2)
    }
  }

  return { theFolder, files, images }
}



function insertJsonContent(
  contents: JSZip,
  d: ContentLocalTable,
) {
  const { theFolder, files, images } = preInsert(contents, d)
  if(!theFolder) return

  const jsonData: LiuExportContentJSON = {
    _id: d._id,
    cloud_id: d.cloud_id,
    insertedStamp: d.insertedStamp,
    updatedStamp: d.updatedStamp,
    infoType: d.infoType,
    user: d.user,
    member: d.member,
    spaceId: d.spaceId,
    spaceType: d.spaceType,
    visScope: d.visScope,
    storageState: d.storageState,
    title: d.title,
    liuDesc: d.liuDesc,
    files,
    images,
    calendarStamp: d.calendarStamp,
    remindStamp: d.remindStamp,
    whenStamp: d.whenStamp,
    remindMe: d.remindMe,
    commentNum: d.commentNum,
    emojiData: d.emojiData,
    parentThread: d.parentThread,
    parentComment: d.parentComment,
    replyToComment: d.replyToComment,
    pinStamp: d.pinStamp,
    createdStamp: d.createdStamp,
    editedStamp: d.editedStamp,
    tagIds: d.tagIds,
    tagSearched: d.tagSearched,
    stateId: d.stateId,
    config: d.config,
  }
  theFolder.file("card.json", JSON.stringify(jsonData, null, 2))
}


async function getContents(spaceId: string) {
  const list: ContentLocalTable[] = []

  // 预防性的计数器，避免陷入疯狂循环
  let runTimes = 0
  const MAX_TIMES = 10

  while(true) {
    let len1 = list.length
    let diff = cfg.max_export_num - len1
    let limit = diff > 16 ? 16 : diff

    const opt: GetDataOpt = {
      spaceId,
      limit,
    }
    if(len1 > 0) {
      opt.lastItemStamp = list[len1 - 1].createdStamp
    }
    const tmpList = await getData(opt)
    list.push(...tmpList)

    const len2 = list.length
    if(len2 >= cfg.max_export_num) break
    if(tmpList.length < 9) break

    if((runTimes++) > MAX_TIMES) break
  }

  return list
}
