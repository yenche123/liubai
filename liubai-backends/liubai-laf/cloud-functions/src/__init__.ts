import cloud from '@lafjs/cloud'
import * as crypto from "crypto"
import type { 
  Table_BlockList, 
  Table_Config, 
  PartialSth,
  Shared_RSA_Key_Pair,
  Shared_ARS_Key_IV,
} from "@/common-types"
import { getNowStamp } from "@/common-time"

const db = cloud.mongo.db

export async function main(ctx: FunctionContext) {
  console.log("__init__ 开始运行............")
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
  const list = await db.collection<Table_BlockList>("BlockList").find(w).toArray()
  console.log("查看获取被屏蔽 ip 的结果: ")
  console.log(list)

  const firRes = list[0]
  const ccc = firRes._id
  console.log("看一下 ccc: ")
  console.log(ccc)
  console.log(" ")

  if(list.length < 1) {
    console.log("没有 ip 需要屏蔽.....")
    return true
  }

  const ips = list.map(v => {
    return v.value
  })

  console.log("去屏蔽这些 ips: ", ips)
  cloud.shared.set(`liu-blocked-ips`, ips)

  return true
}


/** 检查和初始化 config 
 *  比如检查 publicKey 和 privateKey
*/
async function initConfig() {
  const list = await db.collection<Table_Config>("Config").find().toArray()

  console.log("查询 Config 表的结果......")
  console.log(list)
  console.log(" ")

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
  let newCfg: PartialSth<Table_Config, "_id"> = {
    publicKey,
    privateKey,
    insertedStamp: now,
    updatedStamp: now,
    aesKey,
    aesIV,
  }
  if(oldCfg) {
    newCfg = { ...newCfg, ...oldCfg }
  }
  const oldId = newCfg._id
  const col = db.collection("Config")

  if(oldId) {
    // 使用 set 修改数据
    delete newCfg._id
    const res1 = await col.replaceOne({ _id: oldId }, newCfg)
    console.log(`createConfig 使用 doc.set 去修改数据的结果.......`)
    console.log(res1)
    console.log(" ")
    newCfg._id = oldId
  }
  else {
    // 使用 add 去新增数据
    const res2 = await col.insertOne(newCfg as Omit<Table_Config, "_id">)
    console.log(`createConfig 使用col.add 去新增数据的结果.......`)
    console.log(res2)
    const newObjectId = res2.insertedId
    const newId = newObjectId.toString()
    console.log("newId: ", newId)
    console.log(" ")
    newCfg._id = newId
  }

  return newCfg as Table_Config
}

