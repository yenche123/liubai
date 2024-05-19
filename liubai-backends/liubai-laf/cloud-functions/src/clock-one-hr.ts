// Function Name: clock-one-hr
// 定时系统: 每 60 分钟执行一次
// 清理过期的 Credential
import cloud from '@lafjs/cloud'
import { getNowStamp, HOUR } from "@/common-time"

const db = cloud.mongo.db

export async function main(ctx: FunctionContext) {

  // console.log("---------- Start clock-one-hr ----------")
  await clearExpiredCredentials()
  // console.log("---------- End clock-one-hr ----------")
  // console.log(" ")

  return true
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

