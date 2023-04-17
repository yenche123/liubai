import type { 
  ImportedAtom,
  ImportedAsset,
  ImgsFiles,
  ImportedAtom2,
  ImportedStatus,
} from "./types";
import type {
  LiuFileStore,
  LiuImageStore
} from "~/types";
import valTool from "~/utils/basic/val-tool";
import type { LiuExportContentJSON } from "~/types/other/types-export"
import JSZip from "jszip"
import { db } from "~/utils/db";
import type { LiuMyContext } from "~/types/types-context";
import type { ContentLocalTable } from "~/types/types-table";
import { equipThreads } from "~/utils/controllers/equip-content/equip-content";
import ider from "~/utils/basic/ider";

export async function parseOurJson(
  atom: ImportedAtom,
  myCtx: LiuMyContext,
) {
  const { cardJSON, dateStr, assets } = atom
  if(!cardJSON || !dateStr) return

  const jsonStr = await cardJSON.async("text")
  const d = valTool.strToObj<LiuExportContentJSON>(jsonStr)
  if(!d._id || !d.spaceId || !d.spaceType || !d.infoType) return

  // 如果不是自己发表的动态，一律过滤掉；
  // 若是自己的动态，只是 member 不一致，那允许往下执行
  // 因为开放把不同工作区的动态导入进当前工作区
  if(d.user !== myCtx.userId && d.member !== myCtx.memberId) return

  let liuAssets = await parseAssets(dateStr, assets)
  const imgsFiles = getImagesAndFiles(d, liuAssets)
  const ia2 = await getImportedAtom2(d, imgsFiles, myCtx)
  return ia2
}

// 把 zip 里的 assets 转为 { name, arrayBuffer }
async function parseAssets(
  dateStr: string,
  assets?: JSZip.JSZipObject[]
) {
  if(!assets) return []
  const prefix = `${dateStr}assets/`
  const preLen = prefix.length

  let list: ImportedAsset[] = []
  for(let i=0; i<assets.length; i++) {
    const v = assets[i]
    let idx = v.name.indexOf(prefix)
    if(idx < 0) continue
    const name = v.name.substring(idx + preLen)
    const res = await v.async("arraybuffer")
    list.push({ name, arrayBuffer: res })
  }
  
  return list
}

// 把 liuAssets 分别转为 images / files
function getImagesAndFiles(
  d: LiuExportContentJSON,
  liuAssets: ImportedAsset[],
): ImgsFiles {
  const images: LiuImageStore[] = []
  const files: LiuFileStore[] = []
  
  if(d.images?.length) {
    for(let i=0; i<d.images.length; i++) {
      const v1 = d.images[i]
      const v2 = liuAssets.find(v3 => v1.name === v3.name)
      if(!v2) continue
      const img: LiuImageStore = {
        ...v1,
        arrayBuffer: v2.arrayBuffer,
      }
      images.push(img)
    }
  }


  if(d.files?.length) {
    for(let i=0; i<d.files.length; i++) {
      const v1 = d.files[i]
      const v2 = liuAssets.find(v3 => v1.name === v3.name)
      if(!v2) continue
      const f: LiuFileStore = {
        ...v1,
        arrayBuffer: v2.arrayBuffer,
      }
      files.push(f)
    }
  }

  return { images, files }
}



// 开始生成 ImportedAtom2
async function getImportedAtom2(
  d: LiuExportContentJSON,
  imgsFiles: ImgsFiles,
  myCtx: LiuMyContext,
) {

  let { images, files } = imgsFiles
  let c: ContentLocalTable = { ...d, images, files, oState: "OK" }

  // 查找本地动态是否存在
  const res = await db.contents.get(c._id)

  // 动态本地不存在
  if(!res) {

    // 原因见: ../../../README.md
    if(c.cloud_id) {
      c._id = ider.createThreadId()
    }

    delete c.cloud_id
    c.user = myCtx.userId
    c.member = myCtx.memberId
    c.spaceId = myCtx.spaceId
    c.spaceType = myCtx.spaceType
    let ia2 = await _getIa2(c, "new")
    return ia2
  }


  // 动态已存在，检查是否要更新
  // 导入的“更新时间戳” > 原有的“更新时间戳”: 需要更新
  if(c.updatedStamp > res.updatedStamp) {
    // 把 res 的 cloud_url / user / member / spaceId / spaceType 赋值给 c
    // 因为这几个值是不可更改的
    c.cloud_id = res.cloud_id
    c.user = res.user
    c.member = res.member
    c.spaceId = res.spaceId
    c.spaceType = res.spaceType
    let ia2 = await _getIa2(c, "update_required")
    return ia2
  }

  // 无需更新
  let ia2 = await _getIa2(res, "no_change")
  return ia2
}


async function _getIa2(
  c: ContentLocalTable,
  status: ImportedStatus,
) {
  let [threadShow] = await equipThreads([c])
  let ia2: ImportedAtom2 = {
    id: c._id,
    status,
    threadShow,
    threadData: c,
  }
  return ia2
}


