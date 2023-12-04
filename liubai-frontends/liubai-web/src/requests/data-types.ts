// 存放所有接口返回的 data 类型
import type { LiuSpaceAndMember } from "~/types/types-cloud"


/************************ 登录相关 ********************/

export interface Res_UserLoginInit {
  publicKey?: string
  githubOAuthClientId?: string
  googleOAuthClientId?: string
  state?: string
}

export interface Res_ULN_User extends LiuSpaceAndMember {
  userId: string
  createdStamp: number
}

export interface Res_UserLoginNormal {

  // 需要验证 email 时
  email?: string

  // 只有一个 user 符合时
  userId?: string
  token?: string
  serial_id?: string
  spaceMemberList?: LiuSpaceAndMember[]

  // 有多个 user 符合时
  multi_users?: Res_ULN_User[]
  multi_credential?: string
  multi_credential_id?: string
}
