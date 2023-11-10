import cloud from '@lafjs/cloud'
import * as crypto from "crypto"
import type { Table_BlockList, Table_Config, PartialSth } from "@/common-types"

export async function main(ctx: FunctionContext) {
  console.log("__init__ 开始运行............")
  await initBlockedIPs()
  await initConfig()

  return { data123: "Hi! __init__ has been run" }
}


/** 初始化被屏蔽的 ip */
async function initBlockedIPs() {
  const db = cloud.database()
  const w = {
    type: "ip",
    isOn: "Y",
  }
  const res = await db.collection("BlockList").where(w).get<Table_BlockList>()
  console.log("查看获取被屏蔽 ip 的结果: ")
  console.log(res)
  const list = res.data


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
  const db = cloud.database()
  const res = await db.collection("Config").get<Table_Config>()

  console.log("查询 Config 表的结果......")
  console.log(res)
  console.log(" ")

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


  /** 检查完毕，开始填数据到 shared 里 */
  if(c.publicKey && c.privateKey) {
    const pair = {
      publicKey: c.publicKey,
      privateKey: c.privateKey,
    }
    cloud.shared.set("liu-rsa-key-pair", pair)
  }

  /** 查询当前 pair */
  const pair2 = cloud.shared.get("liu-rsa-key-pair")
  console.log(`查询到当前持久缓存的 pair2.......`)
  console.log(pair2)
  console.log(" ")
  
}


async function createConfig(
  oldCfg?: Table_Config,
) {
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

  const now = Date.now()
  let newCfg: PartialSth<Table_Config, "_id"> = {
    publicKey,
    privateKey,
    insertedStamp: now,
    updatedStamp: now,
  }
  if(oldCfg) {
    newCfg = { ...newCfg, ...oldCfg }
  }
  const oldId = newCfg._id

  const db = cloud.database()
  const col = db.collection("Config")

  if(oldId) {
    // 使用 set 修改数据
    delete newCfg._id
    const res1 = await col.doc(oldId).set(newCfg)
    console.log(`createConfig 使用 doc.set 去修改数据的结果.......`)
    console.log(res1)
    console.log(" ")
    newCfg._id = oldId
  }
  else {
    // 使用 add 去新增数据
    const res2 = await col.add(newCfg)
    console.log(`createConfig 使用col.add 去新增数据的结果.......`)
    console.log(res2)
    console.log(" ")
    newCfg._id = res2.id as string
  }

  return newCfg as Table_Config
}

