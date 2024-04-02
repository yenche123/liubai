import type { UploadTaskLocalTable } from "~/types/types-table"
import { db } from "~/utils/db"
import type { LiuImageStore, LiuFileStore } from "~/types"
import APIs from "~/requests/APIs"
import type { 
  Res_FileSet_UploadToken,
} from "~/requests/req-types"
import { uploadViaQiniu } from "./tools/upload-via-qiniu"
import liuReq from "~/requests/liu-req"

let resUploadToken: Res_FileSet_UploadToken | undefined

async function uploadFilesAndImages(
  files: LiuFileStore[] | LiuImageStore[],
) {
  
  if(!resUploadToken) {
    return false
  }

  const cs = resUploadToken.cloudService
  if(cs === "qiniu") {
    await uploadViaQiniu(resUploadToken, files)
  }
  else if(cs === "aliyun_oss") {

  }
  else if(cs === "tecent_cos") {
    
  }
  
}

function checkFiles(
  fileStores: LiuFileStore[],
  files: LiuFileStore[],
) {
  files.forEach(v => {
    if(v.cloud_url) return
    if(v.arrayBuffer) {
      fileStores.push(v)
    }
  })
}

function checkImages(
  imageStores: LiuImageStore[],
  images: LiuImageStore[],
) {
  images.forEach(v => {
    if(v.cloud_url) return
    if(v.arrayBuffer) {
      imageStores.push(v)
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


/** checking out files and images in contents */
export async function handleFiles(tasks: UploadTaskLocalTable[]) {
  
  // 1. get content ids
  const contentIds: string[] = []
  tasks.forEach(v => {
    if(v.content_id) contentIds.push(v.content_id)
  })

  if(contentIds.length < 1) {
    return true
  }

  // 2. get contents from db
  const col = db.contents.where("_id").anyOf(contentIds)
  const contents = await col.toArray()
  if(contents.length < 1) return true

  // 3. get local images and files from contents
  const imgStores: LiuImageStore[] = []
  const fileStores: LiuFileStore[] = []
  contents.forEach(v => {
    const { oState, storageState } = v
    if(oState !== "OK") return
    if(storageState === "LOCAL" || storageState === "ONLY_LOCAL") return
    if(v.files?.length) checkFiles(fileStores, v.files)
    if(v.images?.length) checkImages(imgStores, v.images)
  })

  const needToUpload = imgStores.length > 0 || fileStores.length > 0
  if(needToUpload) {
    console.log("去获取 upload token............")
    const res3 = await getUploadToken()
    if(!res3) return false
  }

  // 4. upload imgStores
  if(imgStores.length) {
    console.log("暂时关闭上传图片.....")
    // console.log("去上传图片............")
    // await uploadFilesAndImages(imgStores)
  }

  // 5. upload fileStores
  if(fileStores.length) {
    // await uploadFilesAndImages(fileStores)
  }



}
