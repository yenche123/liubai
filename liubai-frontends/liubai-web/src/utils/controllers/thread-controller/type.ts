

import type { OState, SortWay } from "~/types/types-basic"
import type { ThreadListViewType } from "~/types/types-view"

export interface TcListOption {

  // 加载哪个工作区的动态
  spaceId: string

  // 当前列表的视图类型
  viewType: ThreadListViewType

  // 每次最多加载多少个，默认为 cfg.default_limit.num
  //（该值是计算过，在 1980px 的大屏上也可以触发触底加载的）
  limit?: number

  // 加载收藏
  collectType?: "EXPRESS" | "FAVORITE"

  // 加载某个 emoji
  emojiSpecific?: string

  // 加载某个标签
  tagId?: string

  // 默认为降序，desc
  sort?: SortWay

  // 已加载出来的最后一个 id 的 createdStamp 或 updatedStamp 或 myFavoriteStamp 或 myEmojiStamp
  // 根据 collectType 和 viewType 的不同，用不同 item 的属性值
  lastItemStamp?: number

  // 指定某个 member 的动态，若有值填 member_id
  member?: string

  // 加载特定的动态
  ids?: string[]

  // 排除某些动态
  excludeIds?: string[]

  // 加载特定状态的动态
  stateId?: string
  
}

export interface TcDataOption {
  id: string
}