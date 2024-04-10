import type {
  ContentLocalTable,
  UploadTaskLocalTable,
} from "~/types/types-table"
import { db } from "~/utils/db"
import type { LiuFileAndImage } from "~/types"
import APIs from "~/requests/APIs"
import type { Res_FileSet_UploadToken } from "~/requests/req-types"
import type { LiuUploadTask, UploadTaskProgressType } from "~/types/types-atom"
import { uploadViaQiniu } from "./tools/upload-via-qiniu"
import liuReq from "~/requests/liu-req"
import type { 
  UploadFileAtom, 
  WhenAFileCompleted, 
  UploadFileRes,
} from "./tools/types"
import time from "~/utils/basic/time"
import type { BoolFunc } from "~/utils/basic/type-tool"

let resUploadToken: Res_FileSet_UploadToken | undefined


async function _storageContent(
  content_id: string,
  file_id: string,
  cloud_url: string,
) {
  // 1. find the content
  const content = await db.contents.get(content_id)
  if(!content) {
    return false
  }

  // 2. put cloud_url into the file
  let foundInImages = false
  let foundInFiles = false
  const { images, files } = content
  images?.forEach(v => {
    if(v.id === file_id) {
      foundInImages = true
      v.cloud_url = cloud_url
    }
  })
  files?.forEach(v => {
    if(v.id === file_id) {
      foundInFiles = true
      v.cloud_url = cloud_url
    }
  })
  if(!foundInImages && !foundInFiles) {
    return false
  }

  // 3. write to db
  const opt: Partial<ContentLocalTable> = {
    updatedStamp: time.getTime(),
  }
  if(foundInImages) opt.images = images
  if(foundInFiles) opt.files = files
  const res3 = await db.contents.update(content_id, opt)
  console.log("_storageContent res3: ", res3)
  console.log(" ")
  return true  
}

async function _deleteFile(
  content_id: string,
  file_id: string,
) {
  // 1. find the content
  const content = await db.contents.get(content_id)
  if(!content) {
    return false
  }

  // 2. define the function to seek and delete the file
  // from images or files
  const _toSeekAndDelete = (list?: LiuFileAndImage[]) =>  {
    if(!list) return false
    let hasFound = false
    for(let i=0; i<list.length; i++) {
      const v = list[i]
      if(v.id === file_id) {
        hasFound = true
        list.splice(i, 1)
        i--
      }
    }
    return hasFound
  }

  // 3. to seek and delete from images or files
  const { images, files } = content
  let foundInImages = _toSeekAndDelete(images)
  let foundInFiles = _toSeekAndDelete(files)
  if(!foundInImages && !foundInFiles) {
    return false
  }

  // 4. write to db
  const opt: Partial<ContentLocalTable> = {
    updatedStamp: time.getTime(),
  }
  if(foundInImages) opt.images = images
  if(foundInFiles) opt.files = files
  const res3 = await db.contents.update(content_id, opt)
  console.log("_deleteFile res3: ", res3)
  console.log(" ")
  return true  
}

async function handleAnAtom(
  atom: UploadFileAtom,
): Promise<UploadFileRes> {
  const rut = resUploadToken as Res_FileSet_UploadToken
  const cs = rut.cloudService

  const files = atom.files
  const cId = atom.contentId

  const promises: Array<Promise<boolean>> = []

  const _whenAFileCompleted: WhenAFileCompleted = (fileId, res) => {
    const code = res.code
    const cloud_url = res.data?.cloud_url

    const _wait = async (a: BoolFunc) => {

      // 1. store cloud_url into files or images in the content
      if(cId && code === "0000" && cloud_url) {
        await _storageContent(cId, fileId, cloud_url)
      }

      // 2. delete the file from the content 
      // when the file format is not supported
      if(cId && code === "E4012") {
        await _deleteFile(cId, fileId)
      }
      
      a(true)
    }
    const pro = new Promise(_wait)
    promises.push(pro)
  }

  let uploadRes: UploadFileRes | undefined
  if(cs === "qiniu") {
    uploadRes = await uploadViaQiniu(rut, files, _whenAFileCompleted)
  }
  else if(cs === "aliyun_oss") {

  }
  else if(cs === "tecent_cos") {
    
  }
  else {
    console.warn("unknown cloud service: ", cs)
  }

  if(promises.length > 0) {
    await Promise.all(promises)
  }

  if(!uploadRes) return "other_err"
  return uploadRes
}


// Exit Event
// if one of type in exit_list occurs, then stop all tasks
const exit_list: UploadFileRes[] = [
  "no_space",
  "too_frequent",
]

async function handleUploadFileAtoms(
  list: UploadFileAtom[],
) {
  if(!resUploadToken) return false

  for(let i=0; i<list.length; i++) {
    const v = list[i]

    // 1. update task's progressType to "file_uploading"
    await changeProgressType(v.taskId, "file_uploading")

    // 2. upload files and images
    const res2 = await handleAnAtom(v)
    console.log("当前任务文件处理结果: ", res2)
    console.log(" ")

    // 3. update task's progressType after handleAnAtom
    const addTryTimes = res2 !== "completed"
    await changeProgressType(v.taskId, "waiting", addTryTimes)

    // 4. if res2 is one of type in exit_list, then stop all tasks
    if(exit_list.includes(res2)) {
      return false
    }
  }

  return true
}


async function changeProgressType(
  taskId: string, 
  progressType: UploadTaskProgressType,
  addTryTimes: boolean = false,
) {
  let tryTimes = 0
  if(addTryTimes) {
    const task = await db.upload_tasks.get(taskId)
    if(task) {
      tryTimes = task.tryTimes ?? 0
      tryTimes++
    }
  }

  const opt1: Partial<UploadTaskLocalTable> = {
    progressType,
    updatedStamp: time.getTime(),
  }
  if(tryTimes) opt1.tryTimes = tryTimes
  const res = await db.upload_tasks.update(taskId, opt1)
  return res
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
