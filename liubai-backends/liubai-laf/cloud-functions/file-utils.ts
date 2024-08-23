import type {
  LiuTimeout,
  DownloadFileOpt,
  DownloadFileResolver,
} from '@/common-types'
import { getSuffix, valTool } from '@/common-util'
import FormData from 'form-data'
import qiniu from "qiniu"
import { createFileRandom } from '@/common-ids'

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
) {
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

interface QutOpt {
  folder?: string
  maxBytes?: number
  whichType: string     // e.g. "wechat-logo"
}

function qiniuUploadToken(
  opt: QutOpt
) {
  // 1. get parameters (形参)
  const _env = process.env
  const aKey = _env.LIU_QINIU_ACCESS_KEY
  const sKey = _env.LIU_QINIU_SECRET_KEY
  const bucket = _env.LIU_QINIU_BUCKET
  const callbackUrl = _env.LIU_QINIU_CALLBACK_URL
  const customKey = _env.LIU_QINIU_CUSTOM_KEY
  let folder = opt?.folder
  if(!folder) {
    folder = _env.LIU_QINIU_THIRD_FOLDER || "third"
  }

  if(!aKey || !sKey || !bucket) {
    console.warn("qiniuUploadToken error")
    console.log("aKey, sKey, and bucket are required")
    return
  }

  if(!callbackUrl || !customKey) {
    console.warn("qiniuUploadToken error")
    console.log("callbackUrl and customKey are required")
    return
  }

  // 2. constuck mac for auth
  const mac = new qiniu.auth.digest.Mac(aKey, sKey)
  const fsizeLimit = opt?.maxBytes ?? MB_10
  const r = createFileRandom()
  const prefix = `${folder}/${opt.whichType}-${r}`

  // 3. constuct upload token
  let callbackBody = qiniuCallBackBody(customKey)

  // 4. make argument (实参)
  const arg = {
    scope: `${bucket}:${prefix}`,
    isPrefixalScope: 1,
    insertOnly: 1,
    expires: 30 * 60,     // 30 mins expiration
    detectMime: 1,
    fsizeLimit,
    callbackUrl,
    callbackBody,
  }

  const putPolicy = new qiniu.rs.PutPolicy(arg)
  const uploadToken = putPolicy.uploadToken(mac)
  return uploadToken
}

export function qiniuCallBackBody(
  customKey: string,
  endUser?: boolean,
) {
  let callbackBody = "bucket=$(bucket)&key=$(key)&hash=$(etag)&fname=$(fname)"
  callbackBody += "&fsize=$(fsize)&mimeType=$(mimeType)"
  if(endUser) callbackBody += "&endUser=$(endUser)"
  callbackBody += `&customKey=${customKey}`
  return callbackBody
}

export function restoreQiniuReqBody(
  body: Record<string, string>,
) {
  if(!body) return ""
  const b = valTool.copyObject(body)

  const keys = Object.keys(b)
  const kLen = keys.length
  if(kLen < 1) return ""
  for(let i=0; i<kLen; i++) {
    const key = keys[i]
    const val = b[key]
    b[key] = valTool.encode_URI_component(val)
  }

  let str = ""
  if(b.bucket) str += `bucket=${b.bucket}&`
  if(b.key) str += `key=${b.key}&`
  if(b.hash) str += `hash=${b.hash}&`
  if(b.fname) str += `fname=${b.fname}&`
  if(b.fsize) str += `fsize=${b.fsize}&`
  if(b.mimeType) str += `mimeType=${b.mimeType}&`
  if(b.endUser) str += `endUser=${b.endUser}&`
  if(b.customKey) str += `customKey=${b.customKey}&`
  
  // 移除最后一个 '&'
  if(str.endsWith("&")) {
    str = str.substring(0, str.length - 1)
  }
  
  return str
}




/********************* qiniu ends ****************/

