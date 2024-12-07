// 一些最基础的原子类型

export type SupportedTheme = "light" | "dark"
export type LocalTheme = SupportedTheme | "system" | "auto"   // auto 就是日夜切换

export type LocalFontSize = "L" | "M"

export type LiuRemindLater = "30min" | "1hr" | "2hr" | "3hr" | "tomorrow_this_moment"

// 必须是 number 因为可能跟其他系统对接，会有不同的提前时间（单位为 minute）
export type LiuRemindEarly = number

// "提醒我" 的结构
export interface LiuRemindMe {
  type: "early" | "later" | "specific_time"

  // 提前多少分钟，若提前一天则为 1440
  early_minute?: LiuRemindEarly   

  // 30分钟后、1小时后、2小时后、3小时后、明天此刻
  later?: LiuRemindLater

  // 具体时间的时间戳
  specific_stamp?: number
}

export type ContentInfoType = "THREAD" | "COMMENT"
export type CollectionInfoType = "EXPRESS" | "FAVORITE"

export const liuNodeTypes = [
  "heading",          // 标题（只有 h1）
  "paragraph",        // 段落
  "bulletList",       // 无序列表
  "orderedList",      // 有序列表
  "listItem",         // 列表里的单元
  "taskList",         // 任务列表
  "taskItem",         // 任务单元
  "blockquote",       // 引言
  "codeBlock",        // 代码块
  "text",             // 纯文本
  "horizontalRule",   // 分割线
] as const

// liu 的内容格式; array[number] 的写法来自
// https://segmentfault.com/q/1010000037769845
export type LiuNodeType = typeof liuNodeTypes[number]

export const isLiuNodeType = (val: string): val is LiuNodeType => {
  return liuNodeTypes.includes(val as LiuNodeType)
}

export const liuMarkTypes = [
  "bold",     // 粗体
  "strike",   // 删除线
  "italic",   // 斜体
  "code",     // 行内代码
  "link",     // 链接
] as const

export type LiuMarkType = typeof liuMarkTypes[number]

export const isLiuMarkType = (val: string): val is LiuMarkType => {
  return liuMarkTypes.includes(val as LiuMarkType)
}

export interface LiuLinkMark {
  type: "link"
  attrs: {
    href: string
    target?: string
    class?: string | null
  }
}

export interface LiuOtherMark {
  type: Exclude<LiuMarkType, "link">
  attrs?: Record<string, any>
}

export type LiuMarkAtom = LiuLinkMark | LiuOtherMark

export type LiuMarks = LiuMarkAtom[] | undefined

export interface LiuContent {
  type: LiuNodeType
  content?: LiuContent[]

  marks?: LiuMarkAtom[]

  // 一些附件信息
  // 比如 有序列表的 start: number 就会放在这里，表示起始的序号
  // 再比如 codeBlock 里的 language: string | null 也会放在这里，表示代码块的语言
  attrs?: Record<string, any>

  text?: string
}

export interface LiuAtomState {
  id: string
  text?: string
  color?: string              // 存储 # 开头的 hex，或者 --liu-state- 开头的系统颜色
  showInIndex: boolean
  contentIds?: string[]
  showFireworks?: boolean     // 是否开启撒花
  updatedStamp: number
  insertedStamp: number
}

export interface LiuStateConfig {
  stateList: LiuAtomState[]
  updatedStamp: number 
}

export interface TagView {
  tagId: string
  text: string
  icon?: string
  oState: "OK" | "REMOVED"
  createdStamp: number
  updatedStamp: number
  children?: TagView[]
}

// 页面状态
/**
 * -1: 正常
 * 0: 加载中
 * 1: 切换中（比如已有内容）
 * 50: 查无内容（404）
 * 51: 没有权限
 * 52: 网络不佳（需要联网才能查看）
 * 53: 该页面需要后端方可访问
 * 54: 当前环境不在微信里（请在微信内打开）
 */
export type PageState = -1 | 0 | 1 | 50 | 51 | 52 | 53 | 54
export type PageStateKey = "OK" 
  | "LOADING"
  | "SWITCHING"
  | "NO_DATA"
  | "NO_AUTH"
  | "NETWORK_ERR"
  | "NEED_BACKEND"
  | "NOT_IN_WECHAT"

// 方案限制
export type LiuLimit = "pin" // 置顶数
  | "workspace"      // 空间数
  | "thread"         // 动态保留数，比如免费版是 200 条
  | "thread_img"     // 动态图片数
  | "comment_img"    // 评论图片数
  | "file_capacity"  // 单个文件容量


// 在 thread-card 内部消化完成的操作（不需要移除或添加至列表里）
export type ThreadInnerOperation = "edit" | "share" | "hourglass"

export type ThreadOutterOperation = "collect" | "emoji" | "delete" | "state" 
  | "restore" | "delete_forever" | "pin" | "float_up" | "tag"

export type ThreadOperation = ThreadInnerOperation | ThreadOutterOperation

export type ThreadInnerUndo = "undo_hourglass"

export type ThreadOutterUndo = "undo_collect" | "undo_emoji" | "undo_delete"
  | "undo_state" | "undo_pin" | "undo_float_up"

export type WhyThreadChange = ThreadInnerOperation | ThreadOutterOperation
  | ThreadInnerUndo | ThreadOutterUndo | "new_thread" | ""

// 当动态被“更新”时，使用 changeFrom 变量得知从哪里发起的改变
export type ThreadChangedFrom = "list" | "detail"
export interface ThreadChangedOpt {
  from?: ThreadChangedFrom
}

// comment-card 没有复原操作，所以无需记忆当前位置，
// 统一交由 comment-area 和 comment-detail 里的 store 监听
export type CommentOperation = "emoji" | "comment" | "share" | "delete"
  | "edit" | "report"

// 常见的数据被操作类型: 新增、删除和更新
export type CommonDataChanged = "create" | "delete" | "edit" 

export interface LinkPreview {
  domain?: string
  preferred_format: string
  title: string
  type: string
  url: string
}

export type LiuTable = "users" | "workspaces" | "members" | "drafts" | "contents"
  | "collections"


/** 
 * 上传的类型
 * 注意！所有撤销的操作，一定要得是 "undo_xxx" 的格式，其中 
 *  xxx 必须就是原操作的名称，否则在 add-upload-task.ts 会运行错误！！ 
 */
export const liuUploadTasks = [
  "thread-post",
  "comment-post",
  "thread-edit",              // 编辑动态
  "thread-only_local",        // 将动态切换为 ONLY_LOCAL
  "thread-hourglass",         // 倒计时器
  "undo_thread-hourglass",    // 【撤销】倒计时
  "thread-when-remind",       // 修改 "什么时候" 和 "提醒我"
  "undo_thread-when-remind",  // 【撤销】修改 "什么时候" 和 "提醒我"
  "collection-favorite",           // 收藏动态
  "undo_collection-favorite",      // 【撤销】收藏
  "collection-react",            // 对 动态、评论 reaction
  "undo_collection-react",       // 【撤销】reaction
  "thread-delete",            // 删除动态
  "undo_thread-delete",       // 【撤销】删除动态
  "thread-state",             // 修改动态的状态
  "undo_thread-state",        // 【撤销】修改动态的状态
  "thread-restore",           // 恢复回收桶里的动态
  "thread-delete_forever",    // 彻底删除动态
  "thread-pin",               // 置顶、取消置顶
  "undo_thread-pin",          // 【撤销】是否置顶
  "thread-tag",               // 修改动态的标签
  "comment-delete",           // 删除评论
  "comment-edit",             // 编辑评论
  "workspace-tag",            // 编辑工作区的标签，这时 target_id 为 workspace id
  "workspace-state_config",   // 编辑工作区的“状态”结构，动态添加标签或上浮时，也会用到这个事件
  "undo_workspace-state_config",  //【撤销】工作区的状态结构之变更
  "member-avatar",            // 修改当前工作区自己的头像
  "member-nickname",          // 修改当前工作区自己的昵称
  "draft-clear",              // 删除某个 draft_id 的草稿
  "draft-set",                // 设置草稿，注意这时 UploadTaskLocalTable 的 content_id
                              // 必须为空（否则会被当作 content-xxx 的事件处理），而是
                              // 用 draft_id 来查询本地的哪个操作
] as const

export type LiuUploadTask = typeof liuUploadTasks[number]

// 需要 script 注入才能嵌入的应用方
export type ParticularScript = "ig" | "twitter" | 
  "calendly" | "telegram" | "github_gist"

// UploadTaskLocalTable.progressType
export type UploadTaskProgressType = "waiting" | "file_uploading" | "syncing"

export type SyncSpeed = "instant" | "normal" | "slow"

// about AI
export type AiCharacter = "deepseek" | "kimi" | "yuewen" | "wanzhi" | "zhipu"