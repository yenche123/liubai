// Function Name: file-utils

import type {
  LiuTimeout,
  DownloadFileOpt,
  DownloadFileRes,
  DownloadFileResolver,
  LiuRqReturn,
} from '@/common-types';
import { getSuffix } from '@/common-util';
import FormData from 'form-data';
import qiniu from "qiniu";

/********************* constants *****************/
const MB = 1024 * 1024
const MB_10 = 10 * MB

/********************* empty function ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing with file-utils")
  return true
}

/********************* useful functions ****************/

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
    let suffix = getSuffix(contentType)
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


/********************* qiniu starts ****************/


export async function uploadToQiniu(
  uint8arr: Uint8Array,
  key: string,
  uploadToken: string,
): Promise<LiuRqReturn> {
  const config = new qiniu.conf.Config()
  const formUploader = new qiniu.form_up.FormUploader(config)
  const putExtra = new qiniu.form_up.PutExtra()

  try {
    const {
      resp,
      data,
    } = await formUploader.put(uploadToken, key, uint8arr, putExtra)

    console.log("resp: ")
    console.log(resp)
    console.log("data: ")
    console.log(data)
    if(resp.statusCode === 200) {
      console.log("success!")
      return { code: "0000", data }
    }
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

