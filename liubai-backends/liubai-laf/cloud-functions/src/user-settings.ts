import cloud from '@lafjs/cloud'
import { verifyToken } from '@/common-util'
import type { 
  Table_User, 
  LiuRqReturn,
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
    getUserSettings(user)
  }

  


  return true
}


/** 已知 user (Table_User) 的情况下，去获取用户设置 */
async function getUserSettings(
  user: Table_User,
) {




}

