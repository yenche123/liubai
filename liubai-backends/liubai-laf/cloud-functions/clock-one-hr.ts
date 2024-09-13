// Function Name: clock-one-hr
// 定时系统: 每 60 分钟执行一次
// 清理过期的 Credential
import cloud from '@lafjs/cloud'
import { getNowStamp, HOUR, DAY, WEEK } from "@/common-time"
import { 
  type Config_WeCom_Qynb,
  type Config_WeChat_GZH, 
  type Table_Config,
  type WxpayReqAuthorizationOpt,
  type Res_Wxpay_Download_Cert,
  type LiuWxpayCert,
} from '@/common-types'
import { liuFetch, liuReq, valTool, WxpayHandler } from '@/common-util'
import {
  wxpay_apiclient_key, 
  wxpay_apiclient_serial_no,
} from "@/secret-config"

const API_WECHAT_ACCESS_TOKEN = "https://api.weixin.qq.com/cgi-bin/token"
const API_WECOM_ACCESS_TOKEN = "https://qyapi.weixin.qq.com/cgi-bin/gettoken"

// 微信支付 下载平台证书
const WXPAY_DOMAIN = "https://api.mch.weixin.qq.com"
const WXPAY_DOWNLOAD_CERT_PATH = `/v3/certificates`

const db0 = cloud.mongo.db
const db = cloud.database()

export async function main(ctx: FunctionContext) {

  // console.log("---------- Start clock-one-hr ----------")

  // 1. clear data expired
  await clearExpiredCredentials()
  await clearDrafts()
  await clearTokens()

  // 2. get config
  const cfg = await getGlobalConfig()
  if(!cfg) return false

  // 3. get accessToken from wechat
  const wechat_gzh = await handleWeChatGZHConfig(cfg)

  // 4. get accessToken from wecom
  const wecom_qynb = await handleWeComQynbConfig(cfg)

  // 5. get wxpay certs
  const wxpay_certs = await handleWxpayCerts()

  // n. update config
  await updateGlobalConfig(cfg, { wechat_gzh, wecom_qynb, wxpay_certs })

  // console.log("---------- End clock-one-hr ----------")
  // console.log("                                      ")

  return true
}


interface UpdateCfgOpt {
  wechat_gzh?: Config_WeChat_GZH
  wecom_qynb?: Config_WeCom_Qynb
  wxpay_certs?: LiuWxpayCert[]
}

async function updateGlobalConfig(
  cfg: Table_Config,
  opt: UpdateCfgOpt,
) {
  
  const str = valTool.objToStr(opt)
  if(!str || str === "{}") {
    console.warn("nothing to update")
    return false
  }

  const u: Partial<Table_Config> = {
    ...opt,
    updatedStamp: getNowStamp(),
  }
  const res2 = await db.collection("Config").doc(cfg._id).update(u)
  // console.log("updateGlobalConfig res2:")
  // console.log(res2)

  return true
}


async function getGlobalConfig() {
  const col = db.collection("Config")
  const res = await col.get<Table_Config>()
  const list = res.data
  let cfg = list[0]
  if(!cfg) {
    console.warn("fail to get config")
    console.log(cfg)
    return
  }
  
  return cfg
}

async function handleWeChatGZHConfig(
  cfg: Table_Config
): Promise<Config_WeChat_GZH | undefined> {
  // 1. get params
  const now1 = getNowStamp()
  const _env = process.env
  const appid = _env.LIU_WX_GZ_APPID
  const secret = _env.LIU_WX_GZ_APPSECRET
  if(!appid || !secret) {
    console.warn("appid and secret are required")
    console.log("fail to get access_token from wechat")
    return
  }

  // 2. fetch access_token
  const url = new URL(API_WECHAT_ACCESS_TOKEN)
  const sP = url.searchParams
  sP.set("grant_type", "client_credential")
  sP.set("appid", appid)
  sP.set("secret", secret)
  const link = url.toString()
  const res1 = await liuReq(link, undefined, { method: "GET" })
  const rData = res1?.data
  const access_token = rData?.access_token
  if(!access_token) {
    console.warn("fail to get access_token from wechat")
    console.log(res1)
    return
  }

  const wechat_gzh: Config_WeChat_GZH = {
    ...cfg.wechat_gzh,
    access_token,
    expires_in: rData?.expires_in,
    lastGetStamp: now1,
  }
  return wechat_gzh
}

async function handleWeComQynbConfig(
  cfg: Table_Config
): Promise<Config_WeCom_Qynb | undefined> {
  // 1. get params
  const now1 = getNowStamp()
  const _env = process.env
  const corpid = _env.LIU_WECOM_QYNB_CORPID
  const secret = _env.LIU_WECOM_QYNB_SECRET
  if(!corpid || !secret) {
    return
  }

  // 2. fetch access_token
  const url = new URL(API_WECOM_ACCESS_TOKEN)
  const sP = url.searchParams
  sP.set("corpid", corpid)
  sP.set("corpsecret", secret)
  const link = url.toString()
  const res1 = await liuReq(link, undefined, { method: "GET" })
  const rData = res1?.data
  const access_token = rData?.access_token
  if(!access_token) {
    console.warn("fail to get access_token from wecom")
    console.log(res1)
    return
  }

  const wecom_qynb: Config_WeCom_Qynb = {
    ...cfg.wecom_qynb,
    access_token,
    expires_in: rData?.expires_in,
    lastGetStamp: now1,
  }
  return wecom_qynb
}


async function clearDrafts() {
  const DAY_21_AGO = getNowStamp() - (21 * DAY)
  const q = {
    updatedStamp: {
      $lte: DAY_21_AGO
    },
    oState: {
      $in: ["POSTED", "DELETED"]
    }
  }
  const col = db0.collection("Draft")
  const res1 = await col.deleteMany(q)
  // console.log("删除 21 天前已发表或已删除的草稿 result: ")
  // console.log(res1)

  const DAY_42_AGO = getNowStamp() - (42 * DAY)
  const q2 = {
    editedStamp: {
      $lte: DAY_42_AGO
    }
  }
  const res2 = await col.deleteMany(q2)
  // console.log("删除过去 42 天内都没被更新的草稿 result: ")
  // console.log(res2)
}


// 去清除已经过期超过 1hr 的凭证
async function clearExpiredCredentials() {
  const ONE_HR_AGO = getNowStamp() - HOUR
  const q = {
    expireStamp: {
      $lte: ONE_HR_AGO
    }
  }
  const col = db0.collection("Credential")
  const res = await col.deleteMany(q)
  // console.log("clearExpiredCredentials res:")
  // console.log(res)

  return true
}

async function clearTokens() {

  const col = db0.collection("Token")

  // 1. to clear the tokens whose isOn is equal to "N"
  const q1 = { isOn: "N" }
  const res1 = await col.deleteMany(q1)

  // 2. to clear the tokens whose expireStamp is less than one week ago
  // and they are not related to binding something
  const ONE_WEEK_AGO = getNowStamp() - WEEK
  const q2 = {
    expireStamp: {
      $lte: ONE_WEEK_AGO,
    },
    infoType: {
      $nin: ["bind-wecom"]
    }
  }
  const res2 = await col.deleteMany(q2)
  
  return true
}

async function handleWxpayCerts(): Promise<LiuWxpayCert[] | undefined> {
  // 0. check out if need
  const _env = process.env
  if(!_env.LIU_WXPAY_API_V3_KEY) return
  if(!wxpay_apiclient_key) return
  if(!wxpay_apiclient_serial_no) return

  // 1. get authorization
  const opt1: WxpayReqAuthorizationOpt = {
    method: "GET",
    path: WXPAY_DOWNLOAD_CERT_PATH,
    apiclient_key: wxpay_apiclient_key,
    apiclient_serial_no: wxpay_apiclient_serial_no,
  }
  const Authorization = WxpayHandler.getWxpayReqAuthorization(opt1)
  if(!Authorization) {
    console.warn("fail to get Authorization in handleWxpayCerts")
    return
  }

  // 2. get headers
  const headers = WxpayHandler.getWxpayReqHeaders({ Authorization })
  
  // 3. to fetch
  const url3 = WXPAY_DOMAIN + WXPAY_DOWNLOAD_CERT_PATH
  const res3 = await liuFetch<Res_Wxpay_Download_Cert>(url3, { headers, method: "GET" })
  const data3 = res3.data
  if(res3.code !== "0000" || !data3) {
    console.warn("fail to fetch certs in handleWxpayCerts")
    console.log("headers: ")
    console.log(headers)
    console.log(res3)
    return
  }

  // 4. verify sign
  const err4 = await WxpayHandler.verifySignByLiuFetch(data3)
  if(err4) {
    console.warn("verify sign failed in handleWxpayCerts")
    console.log(err4)
    return
  }

  // 5. get json from data3
  const json5 = data3.json
  if(!json5) {
    console.warn("no json5 in handleWxpayCerts")
    console.log(data3)
    return
  }

  // 6. decrypt
  const list = json5.data
  const certs: LiuWxpayCert[] = []
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const cert = WxpayHandler.getLiuWxpayCert(v)
    if(cert) {
      certs.push(cert)
    }
  }

  return certs
}

