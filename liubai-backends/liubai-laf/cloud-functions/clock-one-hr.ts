// Function Name: clock-one-hr
// 定时系统: 每 60 分钟执行一次
// 清理过期的 Credential
import cloud from '@lafjs/cloud'
import { getNowStamp, HOUR, DAY } from "@/common-time"

const db = cloud.mongo.db

export async function main(ctx: FunctionContext) {

  // console.log("---------- Start clock-one-hr ----------")
  await clearExpiredCredentials()
  await clearDrafts()
  // console.log("---------- End clock-one-hr ----------")
  // console.log(" ")

  return true
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
  console.log("删除 21 天前已发表或已删除的草稿 result: ")
  console.log(res1)

  const DAY_42_AGO = getNowStamp() - (42 * DAY)
  const q2 = {
    editedStamp: {
      $lte: DAY_42_AGO
    }
  }
  const res2 = await col.deleteMany(q2)
  console.log("删除过去 42 天内都没被更新的草稿 result: ")
  console.log(res2)
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

