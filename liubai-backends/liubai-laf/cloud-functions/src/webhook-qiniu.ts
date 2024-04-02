import type { 
  LiuRqReturn,
  Param_WebhookQiniu, 
  Res_WebhookQiniu, 
  Table_User, 
} from "@/common-types"
import qiniu from "qiniu"
import cloud from '@lafjs/cloud'
import { getNowStamp } from "@/common-time"

const db = cloud.database()
const qiniu_keys = [
  "bucket", "key", "hash", "fname", "fsize", "mimeType", "endUser"
]

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body as Param_WebhookQiniu

  if(!body) {
    return { code: "E4000", errMsg: "body is required in webhook-qiniu" }
  }

  // 1. check if the callback is from qiniu
  const res1 = checkCallbackIsFromQiniu(ctx)
  if(!res1) {
    return { code: "E4003", errMsg: "the callback is not from qiniu" }
  }

  // 2. check the body
  const res2 = checkBody(body)
  if(!res2) {
    return { code: "E4000", errMsg: "some keys in body are not existed" }
  }

  console.log("打印一下 ctx.request........")
  console.log(ctx.request)

  // 3. record quota into user
  recordQuota(body)

  // 4. get return data
  const res4 = getReturnData(body)
  console.log("看一下返回数据.......")
  console.log(res4)

  return res4
}

function checkCallbackIsFromQiniu(
  ctx: FunctionContext,
) {

  const _env = process.env
  const qiniu_custom_key = _env.LIU_QINIU_CUSTOM_KEY
  const body = ctx.request?.body ?? {}
  const customKey = body.customKey

  if(customKey !== qiniu_custom_key) {
    console.warn("customKey is not equal to qiniu_custom_key")
    console.log(customKey)
    return false
  }
  
  return true
}

function checkBody(
  body: Param_WebhookQiniu,
) {

  const keys = Object.keys(body)
  for(let i=0; i<qiniu_keys.length; i++) {
    const k = qiniu_keys[i] as keyof Param_WebhookQiniu
    if(!keys.includes(k)) {
      return false
    }
    const v = body[k]
    if(typeof v !== "string") {
      console.warn(`the value of ${k} is not string`)
      console.log(v)
      return false
    }
  }
  
  return true
}

function getReturnData(
  body: Param_WebhookQiniu,
): LiuRqReturn<Res_WebhookQiniu> {

  const _env = process.env
  const cdn_domain = _env.LIU_QINIU_CDN_DOMAIN
  if(!cdn_domain) {
    return { code: "E5001", errMsg: "cdn_domain is required" }
  }

  const url = `${cdn_domain}/${body.key}`
  return {
    code: "0000",
    data: {
      cloud_url: url,
    }
  }
}

async function recordQuota(
  body: Param_WebhookQiniu,
) {
  let theSize = 0
  try {
    const s = body.fsize
    const s2 = Math.round(parseInt(s) / 1024)
    theSize = s2
  }
  catch(err) {
    console.warn("failed to caculate the size")
    console.log(err)
    return false
  }
  if(theSize < 1) theSize = 1

  const userId = body.endUser
  const col_user = db.collection("User")
  const res1 = await col_user.doc(userId).get<Table_User>()
  const theUser = res1.data
  if(!theUser) {
    console.warn(`cannot find the user: ${userId}`)
    return false
  }

  let total_size = theUser.total_size ?? 0
  let upload_size = theUser.upload_size ?? 0
  total_size += theSize
  upload_size += theSize
  
  const cfg: Partial<Table_User> = {
    total_size,
    upload_size,
    updatedStamp: getNowStamp(),
  }
  const q2 = col_user.where({ _id: userId })
  const res2 = await q2.update(cfg)
  
  // 只是记录容量大小，不是很及时的操作
  // 无需更新缓存

  return true
}

