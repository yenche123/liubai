import type {
  LiuTimeout,
  DownloadFileOpt,
  DownloadFileResolver,
} from '@/common-types'
import { getSuffix } from '@/common-util'
import FormData from 'form-data'

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


