// Function Name: file-utils

import type {
  LiuTimeout,
  DownloadFileOpt,
  DownloadFileRes,
  DownloadFileResolver,
  LiuRqReturn,
  Cloud_ImageStore,
  Cloud_FileStore,
  LiuErrReturn,
  Param_WebhookQiniu,
  DownloadUploadOpt,
  DownloadUploadRes,
} from '@/common-types';
import { getMimeTypeSuffix } from '@/common-util';
import FormData from 'form-data';
import qiniu from "qiniu";
import { 
  createFileRandom, 
  createRandom,
  createImgId,
  createFileId,
} from "@/common-ids";
import { getNowStamp } from "@/common-time";

/********************* constants *****************/
const MB = 1024 * 1024
const MB_10 = 10 * MB

/********************* empty function ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing with file-utils")
  return true
}

/********************* useful functions start ****************/

// download file through url
export function downloadFile(
  url: string,
  opt?: DownloadFileOpt,
): Promise<DownloadFileRes> {
  let timeout: LiuTimeout
  const max_sec = opt?.max_sec ?? 30

  const _listen = (a: DownloadFileResolver) => {
    timeout = setTimeout(() => {
      timeout = undefined
      console.warn("download file timeout")
      a({ code: "E5005" })
    }, max_sec * 1000)
  }

  const _run = async (a: DownloadFileResolver) => {

    _listen(a)

    try {
      const res = await fetch(url)
      if(timeout) {
        clearTimeout(timeout)
      }
      else {
        return
      }

      if(!res.ok) {
        console.warn("not ok")
        console.log("status: ", res.status)
        a({ code: "E4004", errMsg: res.statusText })
        return
      }

      a({ code: "0000", data: { url, res }})
    }
    catch(err) {
      console.warn("err: ")
      console.log(err)
      a({ code:  "E5003" })
    }

    a({ code: "E5001" })
  }

  return new Promise(_run)
}


interface RTFD_Opt {
  formKey?: string      // default: "media"
  filename?: string     // default: `upload.${ext}`
}

// turn response into buffer
export async function responseToFormData(
  res: Response,
  opt?: RTFD_Opt,
) {
  const fileBlob = await res.blob()
  const arrayBuffer = await fileBlob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const contentType = fileBlob.type
  const formKey = opt?.formKey ?? "media"
  let filename = opt?.filename
  if(!filename) {
    let suffix = getMimeTypeSuffix(contentType)
    if(!suffix) suffix = "jpg"
    filename = `upload.${suffix}`
  }

  const form = new FormData()
  form.append(formKey, buffer, {
    contentType,
    filename,
  })
  
  return { form }
}


// download cloud_url and upload to our OSS
export async function downloadAndUpload(
  opt: DownloadUploadOpt,
) {

  // 1. download file
  const res1 = await downloadFile(opt.url)
  const { code, data, errMsg } = res1
  if(code !== "0000" || !data) {
    console.warn("download file err:::")
    console.log(code)
    console.log(errMsg)
    return { code, errMsg }
  }

  // 2. get Uint8Array from response
  const res2 = data.res
  let result: LiuRqReturn<DownloadUploadRes> = { 
    code: "E4000", 
    errMsg: "oss of param is not matched",
  }

  // 3. upload to the targeted OSS
  if(opt.oss === "qiniu") {
    result = await prepareToUploadToQiniu(res2, opt)
  }

  return result
}

// 获取允许的图片类型 由 , 拼接而成的字符串
export function getAcceptImgTypesString() {
  return "image/png,image/jpg,image/jpeg,image/gif,image/webp"
} 


/********************* useful functions end ****************/

/********************* qiniu starts ****************/

async function prepareToUploadToQiniu(
  res: Response,
  opt: DownloadUploadOpt,
): Promise<LiuRqReturn<DownloadUploadRes>> {
  // 0. get bytes
  const fileBlob = await res.blob()
  const arrayBuffer = await fileBlob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  // 1. get upload token
  const folder = `third`
  const uploadToken = qiniuServerUploadToken({ folder })
  if(!uploadToken) {
    console.log("没有 uploadToken")
    return { code: "E4004" }
  }

  // 2. get suffix and filename
  const contentType = fileBlob.type
  const suffix = getMimeTypeSuffix(contentType)
  const r1 = createFileRandom()
  const r2 = createRandom(4)
  const now = getNowStamp()
  const filename = `${opt.prefix}-${r1}-${now}-${r2}`
  let key = `${folder}/${filename}`
  if(suffix) {
    key += `.${suffix}`
  }
  
  // 3. upload
  // const d3_1 = getNowStamp()
  const res3 = await uploadToQiniu(bytes, key, uploadToken)
  // const d3_2 = getNowStamp()
  // console.log(`上传耗时: ${d3_2 - d3_1}ms`)
  const data3 = res3?.data
  if(res3.code !== "0000" || !data3) {
    return res3 as LiuErrReturn
  }

  // 4. cdn_domain
  const _env = process.env
  const cdn_domain = _env.LIU_QINIU_CDN_DOMAIN ?? ""
  if(!cdn_domain) {
    console.warn("cdn_domain is empty")
    return { code: "E5001", errMsg: "cdn_domain is empty" }
  }

  // 5. to parse
  const cloud_url = `${cdn_domain}/${data3.key}`
  let isImage = opt.type === "image"
  if(opt.type === "auto") {
    const imgStr = getAcceptImgTypesString()
    isImage = imgStr.includes(contentType)
  }
  let data5: DownloadUploadRes
  if(isImage) {
    const imgObj = parseImageFromQiniu(data3, filename, cloud_url)
    data5 = {
      resType: "image",
      image: imgObj,
    }
  }
  else {
    const fileObj = parseFileFromQiniu(data3, filename, cloud_url, suffix)
    data5 = {
      resType: "file",
      file: fileObj,
    }
  }

  return { code: "0000", data: data5 }
}


function parseFileFromQiniu(
  data: Param_WebhookQiniu,
  filename: string,
  cloud_url: string,
  suffix: string,
) {
  let size = Number(data.fsize)
  if(isNaN(size)) {
    size = 0
  }

  const obj: Cloud_FileStore = {
    id: createFileId(),
    name: filename,
    lastModified: getNowStamp(),
    suffix,
    size,
    mimeType: data.mimeType,
    url: cloud_url,
  }
  return obj
}


function parseImageFromQiniu(
  data: Param_WebhookQiniu,
  filename: string,
  cloud_url: string,
) {
  let size = Number(data.fsize)
  if(isNaN(size)) {
    size = 0
  }

  const obj: Cloud_ImageStore = {
    id: createImgId(),
    name: filename,
    lastModified: getNowStamp(),
    mimeType: data.mimeType,
    url: cloud_url,
    size,
  }
  return obj
}


export async function uploadToQiniu(
  uint8arr: Uint8Array,
  key: string,
  uploadToken: string,
): Promise<LiuRqReturn<Param_WebhookQiniu>> {
  const config = new qiniu.conf.Config()
  const formUploader = new qiniu.form_up.FormUploader(config)
  const putExtra = new qiniu.form_up.PutExtra()

  try {
    const {
      resp,
      data,
    } = await formUploader.put(uploadToken, key, uint8arr, putExtra)


    if(resp.statusCode === 200) {
      const data2 = data as Param_WebhookQiniu
      return { code: "0000", data: data2 }
    }

    console.warn("uploadToQiniu resp.statusCode is not 200")
    console.log("resp: ")
    console.log(resp)
    console.log("data: ")
    console.log(data)
  }
  catch(err) {
    console.warn("uploadToQiniu error")
    console.log(err)
  }
  
  return { code: "E5001" }
}


interface QutOpt {
  folder?: string
  maxBytes?: number
}

export function qiniuServerUploadToken(
  opt?: QutOpt
) {
  // 1. get parameters (形参)
  const _env = process.env
  const aKey = _env.LIU_QINIU_ACCESS_KEY
  const sKey = _env.LIU_QINIU_SECRET_KEY
  const bucket = _env.LIU_QINIU_BUCKET
  const customKey = _env.LIU_QINIU_CUSTOM_KEY

  if(!aKey || !sKey || !bucket) {
    console.warn("qiniuServerUploadToken error")
    console.log("aKey, sKey, and bucket are required")
    return
  }

  if(!customKey) {
    console.warn("qiniuServerUploadToken error")
    console.log("customKey is required")
    return
  }

  // 2. constuck mac for auth
  const mac = new qiniu.auth.digest.Mac(aKey, sKey)
  const fsizeLimit = opt?.maxBytes ?? MB_10

  // 3. constuct upload token
  let returnBody = qiniuCallBackBody(customKey)
  const scope = opt?.folder ? `${bucket}:${opt.folder}/` : bucket

  // 4. make argument (实参)
  const arg = {
    scope,
    isPrefixalScope: 1,
    insertOnly: 1,
    expires: 10 * 60,     // 10 mins expiration
    detectMime: 1,
    fsizeLimit,
    returnBody,
  }

  const putPolicy = new qiniu.rs.PutPolicy(arg)
  const uploadToken = putPolicy.uploadToken(mac)
  return uploadToken
}

export function qiniuCallBackBody(
  customKey: string,
  endUser?: boolean,
) {
  let str = `{"bucket":"$(bucket)","key":"$(key)","hash":"$(etag)","fname":"$(fname)"`
  str += `,"fsize":"$(fsize)","mimeType":"$(mimeType)"`
  if(endUser) str += `,"endUser":"$(endUser)"`
  str += `,"customKey":"${customKey}"}`
  return str
}

/********************* qiniu ends ****************/

