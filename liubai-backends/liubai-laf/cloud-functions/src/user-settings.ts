import cloud from '@lafjs/cloud'
import { getUserInfos, verifyToken } from '@/common-util'
import type { 
  Table_User, 
  LiuRqReturn,
  Res_UserSettings_Get,
} from './common-types'

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}
  const oT = body.operateType

  const vRes = await verifyToken(ctx, body, { entering: true })
  const user = vRes.userData
  if(!vRes.pass || !user) {
    return vRes.rqReturn ?? { code: "E5001" }
  }

  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "GET") {
    // 获取用户设置
    // 1. 登录方式，比如 email / GitHub ID 等等
    // 2. 已经加入哪些工作区，这些工作区的名称和头像
    res = await getUserSettings(user)
  }


  return true
}


export async function getUserSettings(
  user: Table_User,
): Promise<LiuRqReturn<Res_UserSettings_Get>> {
  const [ui] = await getUserInfos([user])
  if(!ui) {
    return { code: "E4004", errMsg: "it cannot find an userinfo" }
  }

  const { email, github_id, theme, language } = user
  const spaceMemberList = ui.spaceMemberList
  const data: Res_UserSettings_Get = {
    email,
    github_id,
    theme,
    language,
    spaceMemberList,
  }

  return { code: "0000", data }
}

