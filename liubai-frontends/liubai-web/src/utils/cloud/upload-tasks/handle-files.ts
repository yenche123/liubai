import type {
  ContentLocalTable,
  DraftLocalTable,
  MemberLocalTable,
  UploadTaskLocalTable,
} from "~/types/types-table"
import { db } from "~/utils/db"
import type { LiuFileAndImage } from "~/types"
import APIs from "~/requests/APIs"
import type { Res_FileSet_UploadToken } from "~/requests/req-types"
import type { LiuUploadTask } from "~/types/types-atom"
import { uploadViaQiniu } from "./tools/upload-via-qiniu"
import liuReq from "~/requests/liu-req"
import type { 
  UploadFileAtom, 
  WhenAFileCompleted, 
  UploadFileRes,
} from "./tools/types"
import time from "~/utils/basic/time"
import type { BoolFunc } from "~/utils/basic/type-tool"
import uut from "./tools/update-upload-task"
import { useSyncStore } from "~/hooks/stores/useSyncStore"

let resUploadToken: Res_FileSet_UploadToken | undefined


function _seekFileInStores(
  file_id: string,
  cloud_url: string,
  stores?: LiuFileAndImage[],
) {
  if(!stores) return false
  let found = false
  stores.forEach(v => {
    if(v.id === file_id) {
      found = true
      v.cloud_url = cloud_url
    }
  })
  return found
}

async function _storageContent(
  content_id: string,
  file_id: string,
  cloud_url: string,
) {
  // 1. find the content
  const content = await db.contents.get(content_id)
  if(!content) return false

  // 2. put cloud_url into the file
  const { images, files } = content
  let foundInImages = _seekFileInStores(file_id, cloud_url, images)
  let foundInFiles = _seekFileInStores(file_id, cloud_url, files)
  if(!foundInImages && !foundInFiles) {
    return false
  }

  // 3. write into db
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

async function _storageMember(
  member_id: string,
  file_id: string,
  cloud_url: string,
) {
  // 1. find the member
  const member = await db.members.get(member_id)
  if(!member) return false

  // 2. put cloud_url into the file
  let foundInAvatar = false
  const { avatar } = member
  if(avatar?.id === file_id) {
    foundInAvatar = true
    avatar.cloud_url = cloud_url
  }
  if(!foundInAvatar) return false

  // 3. write into db
  const opt: Partial<MemberLocalTable> = {
    updatedStamp: time.getTime(),
  }
  if(foundInAvatar) opt.avatar = avatar
  const res3 = await db.members.update(member_id, opt)
  console.log("_storageMember res3: ", res3)
  console.log(" ")
  return true
}

async function _storageDraft(
  draft_id: string,
  file_id: string,
  cloud_url: string,
) {
  // 1. find the draft
  const draft = await db.drafts.get(draft_id)
  if(!draft) return false

  // 2. put cloud_url into the file
  const { images, files } = draft
  let foundInImages = _seekFileInStores(file_id, cloud_url, images)
  let foundInFiles = _seekFileInStores(file_id, cloud_url, files)
  if(!foundInImages && !foundInFiles) {
    return false
  }

  // 3. write into db
  const opt: Partial<DraftLocalTable> = {
    updatedStamp: time.getTime(),
  }
  if(foundInImages) opt.images = images
  if(foundInFiles) opt.files = files
  const res3 = await db.drafts.update(draft_id, opt)
  console.log("_storageDraft res3: ", res3)
  console.log(" ")
  return true
}

// define the function to seek and delete the file
// from images or files
function _toSeekAndDelete(
  file_id: string, 
  list?: LiuFileAndImage[],
) {
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

async function _deleteFileFromContent(
  content_id: string,
  file_id: string,
) {
  // 1. find the content
  const content = await db.contents.get(content_id)
  if(!content) {
    return false
  }

  // 2. to seek and delete from images or files
  const { images, files } = content
  let foundInImages = _toSeekAndDelete(file_id, images)
  let foundInFiles = _toSeekAndDelete(file_id, files)
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
  console.log("_deleteFileFromContent res3: ", res3)
  console.log(" ")
  return res3 > 0  
}

async function _deleteFileFromDraft(
  draft_id: string,
  file_id: string,
) {
  // 1. find the draft
  const draft = await db.drafts.get(draft_id)
  if(!draft) return false

  // 2. to seek and delete from images or files
  const { images, files } = draft
  let foundInImages = _toSeekAndDelete(file_id, images)
  let foundInFiles = _toSeekAndDelete(file_id, files)
  if(!foundInImages && !foundInFiles) {
    return false
  }

  // 3. write to db
  const opt: Partial<DraftLocalTable> = {
    updatedStamp: time.getTime(),
  }
  if(foundInImages) opt.images = images
  if(foundInFiles) opt.files = files
  const res3 = await db.drafts.update(draft_id, opt)
  console.log("_deleteFileFromDraft res3: ", res3)
  console.log(" ")
  return res3 > 0
}


async function _deleteFileFromMember(
  member_id: string,
  file_id: string,
) {
  // 1. find the member
  const member = await db.members.get(member_id)
  if(!member) return false

  // 2. to check if avatar is the file
  let foundInAvatar = false
  const { avatar } = member
  if(avatar?.id === file_id) {
   foundInAvatar = true 
  }

  if(!foundInAvatar) return false

  // 3. delete the avatar via modifying
  const res3 = await db.members.where("_id").equals(member_id).modify(val => {
    console.log("using modify to delete the avatar property........")
    delete val.avatar
  })
  console.log("_deleteFileFromMember modify res3: ", res3)
  console.log(" ")
  return res3 > 0
}


async function handleAnAtom(
  atom: UploadFileAtom,
): Promise<UploadFileRes> {
  const rut = resUploadToken as Res_FileSet_UploadToken
  const cs = rut.cloudService

  const files = atom.files
  const cId = atom.contentId
  const mId = atom.memberId
  const dId = atom.draftId

  const promises: Array<Promise<boolean>> = []

  const _whenAFileCompleted: WhenAFileCompleted = (fileId, res) => {
    const code = res.code
    const cloud_url = res.data?.cloud_url
    const syncStore = useSyncStore()

    const _wait = async (a: BoolFunc) => {

      // 1. storage cloud_url to the corresponded table
      if(code === "0000" && cloud_url) {
        if(cId) await _storageContent(cId, fileId, cloud_url)
        if(mId) await _storageMember(mId, fileId, cloud_url)
        if(dId) await _storageDraft(dId, fileId, cloud_url)
        syncStore.afterUploadFile(fileId, cloud_url)
      }

      // 2. delete file from the corresponded table
      if(code === "E4012") {
        if(cId) await _deleteFileFromContent(cId, fileId)
        if(mId) await _deleteFileFromMember(mId, fileId)
        if(dId) await _deleteFileFromDraft(dId, fileId)
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
    await uut.changeProgressType(v.taskId, "file_uploading")

    // 2. upload files and images
    const res2 = await handleAnAtom(v)
    console.log("当前任务文件处理结果: ", res2)
    console.log(" ")

    // 3. update task's progressType after handleAnAtom
    const addTryTimes = res2 !== "completed"
    await uut.changeProgressType(v.taskId, "waiting", addTryTimes)

    // 4. if res2 is one of type in exit_list, then stop all tasks
    if(exit_list.includes(res2)) {
      return false
    }
  }

  return true
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


async function extractFilesFromContents(
  contentIds: string[],
  list: UploadFileAtom[],
) {
  if(contentIds.length < 1) return true
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
  return true
}

async function extractFilesFromMembers(
  memberIds: string[],
  list: UploadFileAtom[],
) {
  if(memberIds.length < 1) return true
  const col = db.members.where("_id").anyOf(memberIds)
  const members = await col.toArray()
  if(members.length < 1) return true
  
  for(let i1=0; i1<members.length; i1++) {
    const v1 = members[i1]
    const item = list.find(v2 => v2.memberId === v1._id)
    if(!item) continue
    if(v1.avatar) packFiles(item, [v1.avatar])
  }
  return true
}

async function extractFilesFromDrafts(
  draftIds: string[],
  list: UploadFileAtom[],
) {
  if(draftIds.length < 1 ) return true
  const col = db.drafts.where("_id").anyOf(draftIds)
  const drafts = await col.toArray()
  if(drafts.length < 1) return true

  for(let i1=0; i1<drafts.length; i1++) {
    const v1 = drafts[i1]
    const item = list.find(v2 => v2.draftId === v1._id)
    if(!item) continue
    if(v1.files?.length) packFiles(item, v1.files)
    if(v1.images?.length) packFiles(item, v1.images)
  }
  return true
}


/** 会更新图片的事件 */
const photo_events: LiuUploadTask[] = [
  "thread-post",
  "comment-post",
  "thread-edit",
  "comment-edit",
  "thread-restore",
  "member-avatar",
  "draft-set",
]

/** checking out files and images in contents */
export async function handleFiles(tasks: UploadTaskLocalTable[]) {
  
  // 1. get a variety of ids
  let list: UploadFileAtom[] = []
  const contentIds: string[] = []
  const memberIds: string[] = []
  const draftIds: string[] = []
  tasks.forEach(v => {
    const uT = v.uploadTask
    const isPhotoEvt = photo_events.includes(uT)
    if(!isPhotoEvt) return

    if(v.content_id) {
      if(contentIds.includes(v.content_id)) return
      contentIds.push(v.content_id)
    }
    
    if(v.member_id) {
      if(memberIds.includes(v.member_id)) return
      memberIds.push(v.member_id)
    }

    if(v.draft_id) {
      if(draftIds.includes(v.draft_id)) return
      draftIds.push(v.draft_id)
    }
    
    list.push({
      taskId: v._id,
      contentId: v.content_id,
      memberId: v.member_id,
      draftId: v.draft_id,
      files: [],
    })
  })

  let needUploadFile = contentIds.length > 0 || memberIds.length > 0
  needUploadFile = needUploadFile || draftIds.length > 0
  if(!needUploadFile) {
    return true
  }

  // 2. extract files from contents and put into list
  await extractFilesFromContents(contentIds, list)

  // 3. extract files from members and put into list
  await extractFilesFromMembers(memberIds, list)

  // 4. extract files from drafts and put into list
  await extractFilesFromDrafts(draftIds, list)

  // 5. 删掉 files 为空的项
  list = list.filter(v => v.files.length > 0)
  if(list.length < 1) return true

  // 6. get upload token
  const res4 = await getUploadToken()
  if(!res4) return false

  // 7. handle atoms
  const res5 = await handleUploadFileAtoms(list)
  if(!res5) return false

  return true
}
