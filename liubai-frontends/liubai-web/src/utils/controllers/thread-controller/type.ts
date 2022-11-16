

import type { OState, SortWay } from "../../../types/types-basic"

export interface TcListOption {

  // 是否为仅本地获取，默认为 ture
  // 若为 false 则从云端获取，获取过程中会把更新融进 IndexedDB 里
  // 再把包含 LOCAL / ONLY_LOCAL 的数据返回给调用者，让业务侧能批量绑定到视图上，无需过滤
  onlyLocal?: boolean

  // 默认为 ME
  workspace?: string    

  // 默认为降序，desc
  sort?: SortWay

  // 已加载出来的最后一个 id 的 createdStamp，注意不是 insertedStamp
  lastCreatedStamp?: number

  // 加载正常 / 已移除 / 已删除的哪一种，默认为正常
  oState?: OState

  // 指定某个 member 的动态，若有值填 member_id
  member?: string
}

export interface TcDataOption {
  id: string
  onlyLocal?: boolean
}