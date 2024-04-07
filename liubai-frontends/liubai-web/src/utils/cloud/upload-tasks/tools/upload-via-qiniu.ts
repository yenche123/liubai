import ider from "~/utils/basic/ider"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import fileHelper from "~/utils/files/file-helper"
import type { Res_FileSet_UploadToken } from "~/requests/req-types"
import type { LiuFileAndImage } from "~/types"
import * as qiniu from "qiniu-js"
import type { UploadProgress } from "qiniu-js/esm/upload"
import type { 
  UploadResolver, 
  FileReqReturn, 
  WhenAFileCompleted,
} from "./types"

function _upload(
  f: File,
  key: string,
  token: string,
) {

  const _wait = (a: UploadResolver) => {
    const observer = {
      next(res: UploadProgress) {
        console.log("next.........")
        console.log(res)
      },
      error(err: qiniu.QiniuError | qiniu.QiniuRequestError | qiniu.QiniuNetworkError) {
        console.log("error.........")
        console.log(err)
        a(null)
      },
      complete(res: FileReqReturn) {
        console.log("complete.........")
        console.log(res)
        a(res)
      }
    }

    const observable = qiniu.upload(f, key, token)
    const subscription = observable.subscribe(observer)
  }

  return new Promise(_wait)
}


export async function uploadViaQiniu(
  resUploadToken: Res_FileSet_UploadToken,
  files: LiuFileAndImage[],
  aFileCompleted: WhenAFileCompleted,
) {
  const prefix = resUploadToken?.prefix ?? ""
  const token = resUploadToken?.uploadToken ?? ""

  let tryTimes = 0
  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const f = fileHelper.storeToFile(v)
    if(!f) {
      console.warn("failed to convert store to file")
      return false
    }
    
    const suffix = valTool.getSuffix(f.name)
    const now = time.getTime()
    const nonce = ider.createFileNonce()
    const key = `${prefix}-${now}-${nonce}.${suffix}`
    const res = await _upload(f, key, token)

    // 1. capture all err of network
    if(!res) {
      tryTimes++
      if(tryTimes >= 3) return false
      i--
      continue
    }

    aFileCompleted(v.id, res)

    const cloud_url = res.data?.cloud_url
    if(cloud_url) {
      v.cloud_url = cloud_url
    }
  }

  return files
}