// Function Name: clock-one-hr
// 定时系统: 每 60 分钟执行一次
// 清理过期的 Credential
import cloud from '@lafjs/cloud'
import { getNowStamp, HOUR, DAY } from "@/common-time"
import { 
  type Config_WeChat_GZH, 
  type Table_Config,
} from '@/common-types'
import { liuReq, valTool } from '@/common-util'

const API_WECHAT_ACCESS_TOKEN = "https://api.weixin.qq.com/cgi-bin/token"

const db = cloud.mongo.db
const db2 = cloud.database()

export async function main(ctx: FunctionContext) {

  // console.log("---------- Start clock-one-hr ----------")

  // 1. clear data expired
  await clearExpiredCredentials()
  await clearDrafts()


  // 2. get config
  const cfg = await getGlobalConfig()
  if(!cfg) return false

  // 3. get accessToken from wechat
  const wechat_gzh = await handleWeChatGZHConfig(cfg)

  // n. update config
  await updateGlobalConfig(cfg, { wechat_gzh })

  // console.log("---------- End clock-one-hr ----------")
  // console.log("                                      ")

  return true
}


interface UpdateCfgOpt {
  wechat_gzh?: Config_WeChat_GZH
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
  const res2 = await db2.collection("Config").doc(cfg._id).update(u)
  // console.log("updateGlobalConfig res2:")
  // console.log(res2)

  return true
}


async function getGlobalConfig() {
  const col = db2.collection("Config")
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
    expire_in: rData?.expires_in,
    lastGetStamp: now1,
  }
  return wechat_gzh
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
  const col = db.collection("Draft")
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
  const col = db.collection("Credential")
  const res = await col.deleteMany(q)
  // console.log("clearExpiredCredentials res:")
  // console.log(res)

  return true
}

