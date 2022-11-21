
import type { OState, VisScope, StorageState } from "./types-basic"
import type { LiuContent, LiuRemindMe, StatusView, TagView } from "./types-atom"
import type { FileLocal, ImageShow } from "./index"
import type { TipTapJSONContent } from "./types-editor"


export interface EmojiSystem {
  num: number
  encodeStr: string
}

export interface EmojiData {
  total: number
  system: EmojiSystem[]
}

export interface MemberShow {
  _id: string
  name?: string
  avatar?: ImageShow
  workspace: string
  oState: "OK" | "LEFT" | "DELETED"
}

export interface ThreadShow {
  _id: string
  cloud_id?: string
  insertedStamp: number
  updatedStamp: number
  oState: OState
  user_id?: string
  member_id: string
  workspace: string
  visScope: VisScope
  storageState: StorageState
  title?: string
  content?: TipTapJSONContent
  briefing?: TipTapJSONContent   // 文本很多时的摘要
  images?: ImageShow[]
  files?: FileLocal[]
  whenStamp?: number
  remindStamp?: number
  remindMe?: LiuRemindMe
  creator?: MemberShow         // 发表者本人的 memberShow
  isMine: boolean             // 是否为我所发表的
  myFavorite: boolean         // 是否已收藏
  myFavoriteStamp?: number    // 我收藏时的时间戳
  myEmoji: string             // 是否点过表态，若点过则为 emoji 的 encodeURIComponent，若没有点过则为空字符串
  myEmojiStamp?: number       // 我点赞时的时间戳
  commentNum: number          // 评论数
  emojiData: EmojiData
  pinStamp?: number             // 被置顶时的时间戳
  createdStamp: number      // 动态被创建的时间戳
  editedStamp: number       // 动态被编辑的时间戳
  createdStr: string
  editedStr?: string
}