// Function Name: file-set

// 文件系统
// 这里会使用到第三方依赖 qiniu 进行七牛云到凭证管理
import qiniu from "qiniu"
import { 
  checkIfUserSubscribed, 
  verifyToken,
} from "@/common-util"
import type { 
  LiuRqReturn,
  CloudStorageService,
  Table_User,
  Res_FileSet_UploadToken,
} from "@/common-types"
import { createFileRandom } from "@/common-ids"

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}

  const oT = body.operateType
  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "get-upload-token") {
    res = await getUploadToken(ctx, body)
  }
  
  return res
}


async function getUploadToken(
  ctx: FunctionContext,
  body: Record<string, any>,
) {

  // 1. 检查环境
  const err1 = preCheckForUploadToken()
  if(err1) return err1

  // 2. 验证 token
  const vRes = await verifyToken(ctx, body)
  if(!vRes.pass) return vRes.rqReturn
  const user = vRes.userData

  // 3. 选择使用哪个云存储服务
  const res2 = getTheRightService()
  let res: LiuRqReturn = { code: "E4000" }
  if(res2 === "qiniu") {
    res = getUploadTokenViaQiniu(user)
  }
  else if(res2 === "aliyun_oss") {

  }
  else if(res2 === "tecent_cos") {

  }


  return res
}


function getUploadTokenViaQiniu(
  user: Table_User,
): LiuRqReturn<Res_FileSet_UploadToken> {
  const hasSubscribed = checkIfUserSubscribed(user)

  // 1. 构造鉴权对象 mac
  const _env = process.env
  const qiniu_access_key = _env.LIU_QINIU_ACCESS_KEY ?? ""
  const qiniu_secret_key = _env.LIU_QINIU_SECRET_KEY ?? ""
  const qiniu_bucket = _env.LIU_QINIU_BUCKET ?? ""
  const qiniu_callback_url = _env.LIU_QINIU_CALLBACK_URL ?? ""
  const qiniu_custom_key = _env.LIU_QINIU_CUSTOM_KEY ?? ""
  const qiniu_folder = _env.LIU_QINIU_FOLDER || "users"
  const mac = new qiniu.auth.digest.Mac(qiniu_access_key, qiniu_secret_key)

  const MB = 1024 * 1024
  const MB_10 = 10 * MB
  const MB_100 = 100 * MB

  const r = createFileRandom()
  const prefix = `${qiniu_folder}/${user._id}-${r}`

  // 2. 构造上传凭证
  let callbackBody = "bucket=$(bucket)&key=$(key)&hash=$(etag)&fname=$(fname)"
  callbackBody += "&fsize=$(fsize)&mimeType=$(mimeType)&endUser=$(endUser)"
  callbackBody += `&customKey=${qiniu_custom_key}`

  const opt = {
    scope: `${qiniu_bucket}:${prefix}`,
    isPrefixalScope: 1,
    insertOnly: 1,
    endUser: user._id,
    expires: 3600,   // 一小时后过期
    detectMime: 1,
    fsizeLimit: hasSubscribed ? MB_100 : MB_10,
    callbackUrl: qiniu_callback_url,
    callbackBody,
  }

  const putPolicy = new qiniu.rs.PutPolicy(opt)
  const uploadToken = putPolicy.uploadToken(mac)

  return {
    code: "0000",
    data: {
      cloudService: "qiniu",
      uploadToken,
      prefix,
    }
  }
}

function preCheckForUploadToken(): LiuRqReturn | undefined {
  const _env = process.env
  const qiniu_access_key = _env.LIU_QINIU_ACCESS_KEY
  const qiniu_secret_key = _env.LIU_QINIU_SECRET_KEY
  const qiniu_bucket = _env.LIU_QINIU_BUCKET
  if(!qiniu_access_key || !qiniu_secret_key || !qiniu_bucket) {
    return { 
      code: "E5001", 
      errMsg: "qiniu access_key, secret_key, and bucket are required", 
    }
  }

  const qiniu_callback_url = _env.LIU_QINIU_CALLBACK_URL
  if(!qiniu_callback_url) {
    return { 
      code: "E5001", 
      errMsg: "qiniu_callback_url is required", 
    }
  }

  const qiniu_cdn_domain = _env.LIU_QINIU_CDN_DOMAIN
  if(!qiniu_cdn_domain) {
    return { 
      code: "E5001", 
      errMsg: "qiniu_cdn_domain is required", 
    }
  }

  const qiniu_custom_key = _env.LIU_QINIU_CUSTOM_KEY
  if(!qiniu_custom_key) {
    return { 
      code: "E5001", 
      errMsg: "qiniu_custom_key is required", 
    }
  }
  
}

function getTheRightService(): CloudStorageService {
  return "qiniu"
}