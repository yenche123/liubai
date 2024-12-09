// Function Name: service-poly

import cloud from '@lafjs/cloud'
import { LiuRqReturn, ServicePolyAPI, Table_Config } from './common-types'
import { createCommonNonce } from '@/common-ids'
import { getNowStamp } from '@/common-time'
import * as crypto from "crypto";

const db = cloud.database()

export async function main(ctx: FunctionContext) {


  const body = ctx.request?.body ?? {}
  const oT = body.operateType

  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "get-wxjssdk-config") {
    res = await get_wxjssdk_config(body)
  }

  return res
}

async function get_wxjssdk_config(
  body: Record<string, any>,
): Promise<LiuRqReturn<ServicePolyAPI.Res_GetWxjssdkConfig>> {
  // 0. check out body
  const url = body.url
  if(!url || typeof url !== "string") {
    return { code: "SPY000", errMsg: "url is required" }
  }

  // 1. get wx gzh appid
  const _env = process.env
  const appId = _env.LIU_WX_GZ_APPID
  if(!appId) {
    return { code: "SPY001", errMsg: "wx gzh appid not found" }
  }

  // 2. get js api ticket
  const col = db.collection("Config")
  const res = await col.getOne<Table_Config>()
  const d = res.data
  const jsapi_ticket = d?.wechat_gzh?.jsapi_ticket
  if(!jsapi_ticket) {
    return { code: "SPY002", errMsg: "wx gzh jsapi_ticket not found" }
  }

  // 3. construct params for signature
  const nonceStr = createCommonNonce()
  const now = getNowStamp()
  const timestamp = Math.floor(now / 1000)

  // console.log("jsapi_ticket: ", jsapi_ticket)
  // console.log("nonceStr: ", nonceStr)
  // console.log("timestamp: ", timestamp)
  // console.log("url: ", url)

  // 4. calculate signature
  const str = `jsapi_ticket=${jsapi_ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`
  const sha1 = crypto.createHash('sha1')
  const signature = sha1.update(str).digest('hex')

  // console.log("signature: ", signature)

  const data: ServicePolyAPI.Res_GetWxjssdkConfig = {
    operateType: "get-wxjssdk-config",
    appId,
    timestamp,
    nonceStr,
    signature,
  }
  return { code: "0000", data }
}