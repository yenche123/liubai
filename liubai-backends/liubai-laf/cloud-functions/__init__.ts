// Function Name: __init__
import cloud from '@lafjs/cloud'
import * as crypto from "crypto"
import type { 
  Partial_Id,
  MongoFilter,
  Table_BlockList, 
  Table_Config, 
  Shared_RSA_Key_Pair,
  Shared_ARS_Key_IV,
} from "@/common-types"
import { getNowStamp } from "@/common-time"
import { getDocAddId } from '@/common-util'

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("__init__ 开始运行............")

  const nodeVersion = process.version
  console.log("当前 node 版本号: ", nodeVersion)

  await initBlockedIPs()
  await initConfig()

  return { data123: "Hi! __init__ has been run" }
}


/** 初始化被屏蔽的 ip */
async function initBlockedIPs() {
  const w: Partial<Table_BlockList> = {
    type: "ip",
    isOn: "Y",
  }
  const col = db.collection("BlockList")
  const q = col.where(w)
  const res = await q.get<Table_BlockList>()
  const list = res.data
  if(list.length < 1) {
    console.log("没有 ip 需要屏蔽.....")
    return true
  }

  const ips = list.map(v => v.value)
  cloud.shared.set(`liu-blocked-ips`, ips)

  return true
}


/** 检查和初始化 config 
 *  比如检查 publicKey 和 privateKey
*/
async function initConfig() {
  const col = db.collection("Config")
  const res = await col.get<Table_Config>()
  const list = res.data
  let c = list[0]

  // 若不存在任何配置
  if(!c) {
    c = await createConfig()
  }

  /** 开始对 firCfg 进行检查 */
  if(!c.publicKey) {
    console.warn(`[异常] 配置中公钥不存在 !!!!!!`)
  }
  if(!c.privateKey) {
    console.warn(`[异常] 配置中私钥不存在 !!!!!!`)
  }

  if(!c.aesKey || !c.aesIV) {
    c = await createConfig(c)
  }


  /** 检查完毕，开始填数据到 shared 里 */
  // 1. RSA Key-Pair
  if(c.publicKey && c.privateKey) {
    const pair: Shared_RSA_Key_Pair = {
      publicKey: c.publicKey,
      privateKey: c.privateKey,
    }
    cloud.shared.set("liu-rsa-key-pair", pair)
  }

  // 2. AES Key & IV
  if(c.aesKey && c.aesIV) {
    const aesData: Shared_ARS_Key_IV = {
      aesKey: c.aesKey,
      aesIV: c.aesIV,
    }
    cloud.shared.set("liu-aes-key-iv", aesData)
  }
  
}


async function createConfig(
  oldCfg?: Table_Config,
) {

  // 1. 生成 RSA keyPair
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  // 2. 生成 AES-GCM key & iv
  const aesKeyBuffer = crypto.randomBytes(32)
  const aesIVBuffer = crypto.randomBytes(16)
  const aesKey = aesKeyBuffer.toString("base64")
  const aesIV = aesIVBuffer.toString("base64")
  
  const now = getNowStamp()
  let newCfg: Partial_Id<Table_Config> = {
    publicKey,
    privateKey,
    insertedStamp: now,
    updatedStamp: now,
    aesKey,
    aesIV,
  }
  if(oldCfg) {
    newCfg = { ...newCfg, ...oldCfg, updatedStamp: now }
  }
  const oldId = newCfg._id

  if(oldId) {
    // 使用 set 修改数据
    delete newCfg._id
    const col_1 = db.collection("Config")
    const q = col_1.where({ _id: oldId })
    const res1 = await q.update(newCfg)
    newCfg._id = oldId
  }
  else {
    // 使用 add 去新增数据
    const col_2 = db.collection("Config")
    const res2 = await col_2.add(newCfg)
    const newId = getDocAddId(res2)
    newCfg._id = newId
  }

  return newCfg as Table_Config
}

