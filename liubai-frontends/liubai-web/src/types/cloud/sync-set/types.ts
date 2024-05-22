import type { 
  LiuContent, 
  LiuRemindMe,
  ContentInfoType,
  TagView,
  LiuUploadTask,
} from "~/types/types-atom"
import type { OState, OState_2, OState_Draft } from "~/types/types-basic"
import type { 
  Cloud_ImageStore,
  Cloud_FileStore,
  Cloud_StateConfig,
} from "~/types/types-cloud"
import type { ContentConfig } from "~/types/other/types-custom";
import type { EmojiData } from "~/types/types-content"

/********************* Request types **********************/

/** 上传数据的基类型 */
export interface LiuUploadBase {
  id?: string          // 如果是已上传过的内容，必须有此值，这是后端的 _id
  first_id?: string    // 能传就传
  spaceId?: string     // 发表时，必填，表示存到哪个工作区

  liuDesc?: LiuContent[]
  images?: Cloud_ImageStore[]
  files?: Cloud_FileStore[]
  
  editedStamp?: number
}

/** 存一些 动态 与评论和草稿相比独有的字段 */
export interface LiuUploadThread extends LiuUploadBase {

  // 仅在 thread-post 时有效且此时必填
  oState?: Exclude<OState, "DELETED">

  title?: string
  calendarStamp?: number
  remindStamp?: number
  whenStamp?: number
  remindMe?: LiuRemindMe
  pinStamp?: number

  createdStamp?: number
  removedStamp?: number

  tagIds?: string[]
  tagSearched?: string[]
  stateId?: string

  // 只在 thread-post 时有效，且此时必填
  emojiData?: EmojiData
  config?: ContentConfig

  // 只在 thread-hourglass 时有效，且为必填，不得为 undefined
  showCountdown?: boolean

  
}

/** 存一些 评论 与动态和草稿相比独有的字段 */
export interface LiuUploadComment extends LiuUploadBase {
  parentThread?: string
  parentComment?: string
  replyToComment?: string
  createdStamp?: number

  // 只在 comment-post 时有效，且此时必填
  emojiData?: EmojiData
}

/** 存一些 草稿 与评论和动态相比独有的字段 */
export interface LiuUploadDraft extends LiuUploadBase {
  oState?: OState_Draft
  infoType?: ContentInfoType      // 新建 draft 时，必填
  
  threadEdited?: string
  commentEdited?: string
  parentThread?: string
  parentComment?: string
  replyToComment?: string
  
  title?: string
  whenStamp?: number
  remindMe?: LiuRemindMe
  tagIds?: string[]
}

export interface LiuUploadMember {
  id: string
  name?: string
  avatar?: Cloud_ImageStore
}

export interface LiuUploadWorkspace {
  id: string
  name?: string
  avatar?: Cloud_ImageStore
  stateConfig?: Cloud_StateConfig
  tagList?: TagView[]
}

export interface LiuUploadCollection {
  id?: string          // 如果是已上传必须有此值，这是后端的 _id
  first_id: string
  oState: OState_2
  content_id: string
  emoji?: string
  sortStamp: number
}

export interface SyncSetAtom {
  taskType: LiuUploadTask
  taskId: string

  thread?: LiuUploadThread
  comment?: LiuUploadComment
  draft?: LiuUploadDraft
  member?: LiuUploadMember
  workspace?: LiuUploadWorkspace
  collection?: LiuUploadCollection

  operateStamp: number // 表示这个操作被发起的时间戳，非常重要，用于校时用
}


/********************* Response types **********************/

// an atom which is returned by `sync-set` cloud function
export interface SyncSetAtomRes {
  code: string
  taskId: string
  errMsg?: string
  first_id?: string  // the first id of either content or draft
  new_id?: string    // the new id of either content or draft
}

/** Res_SyncSet on client end */
export interface Res_SyncSet_Client {
  results: SyncSetAtomRes[]
}