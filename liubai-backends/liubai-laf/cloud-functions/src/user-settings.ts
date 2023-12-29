import cloud from '@lafjs/cloud'
import { getUserInfos, verifyToken } from '@/common-util'
import type { 
  Table_User, 
  LiuRqReturn,
  Res_UserSettings_Enter,
} from './common-types'
import { getNowStamp } from "@/common-time"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}
  const oT = body.operateType

  const stamp1 = getNowStamp()

  const vRes = await verifyToken(ctx, body, { entering: true })
  const user = vRes.userData
  if(!vRes.pass || !user) {
    return vRes.rqReturn ?? { code: "E5001" }
  }

  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "enter") {
    // 获取用户设置并记录用户访问
    res = await handle_enter(user)
  }


  const stamp2 = getNowStamp()
  const diffS = stamp2 - stamp1
  console.log(`调用 user-settings 耗时: ${diffS}ms`)

  return res
}


export async function handle_enter(
  user: Table_User,
) {

  // 1. 去获取用户基础设置
  const res1 = await getUserSettings(user)
  if(res1.code !== "0000") {
    return res1
  }

  // 2. 去记录用户访问了应用
  const now = getNowStamp()
  const u: Partial<Table_User> = {
    lastEnterStamp: now,
    updatedStamp: now,
  }

  // 【待测试】 是否可以使用 .doc().update()
  db.collection("User").doc(user._id).update(u)

  return res1
}

/**
 * 获取用户基础设置
 * 1. 登录方式，比如 email / GitHub ID 等等
 * 2. 已经加入哪些工作区，这些工作区的名称和头像
 */
export async function getUserSettings(
  user: Table_User,
): Promise<LiuRqReturn<Res_UserSettings_Enter>> {
  const [ui] = await getUserInfos([user])
  if(!ui) {
    return { code: "E4004", errMsg: "it cannot find an userinfo" }
  }

  const { email, github_id, theme, language } = user
  const spaceMemberList = ui.spaceMemberList
  const data: Res_UserSettings_Enter = {
    email,
    github_id,
    theme,
    language,
    spaceMemberList,
  }

  return { code: "0000", data }
}

