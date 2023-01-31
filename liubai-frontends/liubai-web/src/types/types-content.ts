
import type { OState, VisScope, StorageState } from "./types-basic"
import type { LiuRemindMe } from "./types-atom"
import type { ImageShow, LiuFileStore } from "./index"
import type { TipTapJSONContent } from "./types-editor"
import type { ContentConfig } from "./other/types-custom"

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

export interface TagShow {
  tagId: string
  text: string
  emoji?: string
}

export interface StateShow {
  text?: string           // 用户输入的问题，该字段跟 text_key 二选一，优先使用 text
  text_key?: string       // i18n 的字段，该字段跟 text 二选一
  bgColor: string         // 状态的背景色，如果是 css 变量，必须包含 var(....)
  fontColor: string       // 状态的文字色，如果是 css 变量，必须包含 var(....)
}

export interface ThreadShow {
  _id: string
  cloud_id?: string
  _old_id?: string           // 刚上传完的动态会有此字段，表示旧的 _id
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
  summary?: string               // content 转为单行的纯文本，并且限制字数在 140 字内;
                                 // 如果 content 不存在，看文件是否存在，若有打印文件名
  images?: ImageShow[]
  files?: LiuFileStore[]
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
  tags?: TagShow[]
  tagSearched?: string[]
  stateId?: string
  stateShow?: StateShow
  config?: ContentConfig
}