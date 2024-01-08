import cloud from '@lafjs/cloud'
import { getUserInfos, verifyToken } from '@/common-util'
import type { 
  Table_User, 
  LiuRqReturn,
  Res_UserSettings_Enter,
  VerifyTokenRes,
} from './common-types'
import { getNowStamp } from "@/common-time"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}
  const oT = body.operateType

  const stamp1 = getNowStamp()

  const entering = oT === "enter"
  const vRes = await verifyToken(ctx, body, { entering })
  const user = vRes.userData
  if(!vRes.pass || !user) {
    return vRes.rqReturn ?? { code: "E5001" }
  }

  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "enter") {
    // 获取用户设置并记录用户访问
    res = await handle_enter(vRes)
  }


  const stamp2 = getNowStamp()
  const diffS = stamp2 - stamp1
  console.log(`调用 user-settings 耗时: ${diffS}ms`)

  return res
}


export async function handle_enter(
  vRes: VerifyTokenRes,
) {
  const user = vRes.userData as Table_User

  // 1. 去获取用户基础设置
  const res1 = await getUserSettings(user)
  if(res1.code !== "0000" || !res1.data) {
    return res1
  }

  // 2. 去记录用户访问了应用
  const now = getNowStamp()
  const u: Partial<Table_User> = {
    lastEnterStamp: now,
    updatedStamp: now,
  }

  // 3. 查看 verifyToken 时，是否有生成新的 token serial
  // 若有，送进回调里
  if(vRes.new_serial && vRes.new_token) {
    res1.data.new_serial = vRes.new_serial
    res1.data.new_token = vRes.new_token
  }
  
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

