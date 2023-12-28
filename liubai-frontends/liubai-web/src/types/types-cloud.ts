import type { LiuExif } from "./index"
import type { MemberState, SpaceType, OState } from "./types-basic"
import type { LiuAtomState } from "./types-atom"

export interface Cloud_FileStore {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  suffix: string             // 后缀的英文
  size: number               // 单位为 bytes
  mimeType: string
  url: string
}

export interface Cloud_ImageStore {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  mimeType?: string
  width?: number
  height?: number
  h2w?: string
  url: string
  url_2?: string             // 低分辨率的图片地址
  blurhash?: string
  someExif?: LiuExif
}

/** 工作区内，存储 “状态” 的结构  */
interface Cloud_StateConfig {
  stateList?: LiuAtomState[]
  updatedStamp: number
}


/** 登录时，后端传回来的用户基础信息
 * 只有基础的，复杂的数据配置，需要另外调用
*/
export interface LiuSpaceAndMember {
  // 关于 member 的信息
  memberId: string
  member_name?: string
  member_avatar?: Cloud_ImageStore
  member_oState: MemberState

  // 关于 workspace 的信息
  spaceId: string
  spaceType: SpaceType
  space_oState: OState
  space_owner: string
  space_name?: string
  space_avatar?: Cloud_ImageStore
}