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
  UploadFileRes,
} from "./types"
import liuConsole from "~/utils/debug/liu-console"

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

        // logger
        liuConsole.addBreadcrumb({ 
          category: "qiniu.upload",
          message: "upload file to qiniu error",
          level: "error",
        })
        liuConsole.sendException(err)

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
): Promise<UploadFileRes> {
  const prefix = resUploadToken?.prefix ?? ""
  const token = resUploadToken?.uploadToken ?? ""

  let tryTimes = 0
  let allHasCloudUrl = false

  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const f = fileHelper.storeToFile(v)
    if(!f) {
      console.warn("failed to convert store to file")
      return "other_err"
    }
    
    const suffix = valTool.getSuffix(f.name)
    const now = time.getTime()
    const nonce = ider.createFileNonce()
    const key = `${prefix}-${now}-${nonce}.${suffix}`
    const res = await _upload(f, key, token)

    // 1. capture all err of network
    if(!res) {
      tryTimes++
      if(tryTimes >= 3) return "network_err"
      i--
      continue
    }

    aFileCompleted(v.id, res)

    const { code } = res
    if(code === "E4003") {
      return "too_frequent"
    }
    else if(code === "E4010") {
      return "no_space"
    }
    
    const cloud_url = res.data?.cloud_url
    if(!cloud_url) {
      allHasCloudUrl = false

      // logger
      liuConsole.addBreadcrumb({
        category: "upload.file",
        message: "there is no cloud_url in uploadViaQiniu",
        level: "warning",
        data: res,
      })
      liuConsole.sendMessage("No cloud_url in uploadViaQiniu")
    }
  }

  return allHasCloudUrl ? "completed" : "partial_success"
}