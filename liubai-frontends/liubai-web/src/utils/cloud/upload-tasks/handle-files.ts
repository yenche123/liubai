import type { UploadTaskLocalTable } from "~/types/types-table"
import { db } from "~/utils/db"
import type { LiuFileAndImage } from "~/types"
import APIs from "~/requests/APIs"
import type { Res_FileSet_UploadToken } from "~/requests/req-types"
import type { LiuUploadTask } from "~/types/types-atom"
import { uploadViaQiniu } from "./tools/upload-via-qiniu"
import liuReq from "~/requests/liu-req"
import type { FileReqReturn, UploadFileAtom, WhenAFileCompleted } from "./tools/types"
import time from "~/utils/basic/time"

let resUploadToken: Res_FileSet_UploadToken | undefined

async function uploadFilesAndImages(
  files: LiuFileAndImage[],
  aFileCompleted: WhenAFileCompleted,
) {
  
  if(!resUploadToken) {
    return false
  }

  const cs = resUploadToken.cloudService
  if(cs === "qiniu") {
    await uploadViaQiniu(resUploadToken, files, aFileCompleted)
  }
  else if(cs === "aliyun_oss") {

  }
  else if(cs === "tecent_cos") {
    
  }
  
}


async function handleUploadFileAtoms(
  list: UploadFileAtom[],
) {
  if(!resUploadToken) return false

  const _whenAFileCompleted: WhenAFileCompleted = (f, res) => {
    
  }

  for(let i=0; i<list.length; i++) {
    const v = list[i]

    // 1. update task's progressType to "file_uploading"
    const opt1: Partial<UploadTaskLocalTable> = {
      progressType: "file_uploading",
      updatedStamp: time.getTime(),
    }
    await db.upload_tasks.update(v.taskId, opt1)

    // 2. upload files and images
    const res2 = await uploadFilesAndImages(v.files, _whenAFileCompleted)
  }
  
}


function packFiles(
  atom: UploadFileAtom,
  files: LiuFileAndImage[],
) {
  files.forEach(v => {
    if(v.cloud_url) return
    if(v.arrayBuffer) {
      atom.files.push(v)
    }
  })
}


async function getUploadToken() {
  const url = APIs.UPLOAD_FILE
  const param = { operateType: "get-upload-token" }
  const res = await liuReq.request<Res_FileSet_UploadToken>(url, param)
  if(res.code === "0000" && res.data) {
    resUploadToken = res.data
    return true
  }

  console.warn("failed to get upload token")
  console.log(res)
  console.log(" ")
  return false
}


/** 会更新图片的事件 */
const photo_events: LiuUploadTask[] = [
  "content-post",
  "thread-edit",
  "comment-edit",
  "thread-restore",
]

/** checking out files and images in contents */
export async function handleFiles(tasks: UploadTaskLocalTable[]) {
  
  // 1. get content ids
  // TODO: 也可能图片或文件不是存在 content 里
  let list: UploadFileAtom[] = []
  const contentIds: string[] = []
  tasks.forEach(v => {
    const uT = v.uploadTask
    const isPhotoEvt = photo_events.includes(uT)
    if(!isPhotoEvt || !v.content_id) return
    if(contentIds.includes(v.content_id)) return
    contentIds.push(v.content_id)
    list.push({
      taskId: v._id,
      contentId: v.content_id,
      files: [],
    })
  })

  if(contentIds.length < 1) {
    return true
  }

  // 2. get contents from db
  const col = db.contents.where("_id").anyOf(contentIds)
  const contents = await col.toArray()
  if(contents.length < 1) return true

  for(let i1=0; i1<contents.length; i1++) {
    const v1 = contents[i1]
    const item = list.find(v2 => v2.contentId === v1._id)
    if(!item) continue
    if(v1.files?.length) packFiles(item, v1.files)
    if(v1.images?.length) packFiles(item, v1.images)
  }

  // 3. 删掉 files 为空的项
  list = list.filter(v => v.files.length > 0)
  if(list.length < 1) return true

  // 4. get upload token
  const res4 = await getUploadToken()
  if(!res4) return false

  // 5. handle atoms
  const res5 = await handleUploadFileAtoms(list)
  if(!res5) return false


}
