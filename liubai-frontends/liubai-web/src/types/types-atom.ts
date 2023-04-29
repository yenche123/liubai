// 一些最基础的原子类型

export type LiuRemindLater = "30min" | "1hr" | "2hr" | "3hr" | "tomorrow_this_moment"

// 必须是 number 因为可能跟其他系统对接，会有不同的提前时间（单位为 minute）
export type LiuRemindEarly = number

// "提醒我" 的结构
export interface LiuRemindMe {
  type: "early" | "later" | "specific_time"

  // 提前多少分钟，若提前一天则为 1440
  early_minute?: LiuRemindEarly   

  // 30分钟后、1小时候、2小时后、3小时后、明天此刻
  later?: LiuRemindLater

  // 具体时间的时间戳
  specific_stamp?: number
}


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

export interface LiuMarkAtom {
  type: LiuMarkType
  attrs?: Record<string, any>
}

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
  showInIndex: boolean
  text?: string
  color?: string              // 存储 # 开头的 hex，或者 --liu-state- 开头的系统颜色
  contentIds?: string[]
  showFireworks?: boolean     // 是否开启撒花
  updatedStamp: number
  insertedStamp: number
}

export interface LiuStateConfig {
  stateList: LiuAtomState[]
  cloudStateList: LiuAtomState[]        // 远端最新存储的 stateList
  updatedStamp: number
  cloudUpdatedStamp?: number             // cloudStateList 被修改的时间戳    
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
 */
export type PageState = -1 | 0 | 1 | 50 | 51


// 方案限制
export type LiuLimit = "pin" // 置顶数
  | "workspace"      // 空间数
  | "thread"         // 动态保留数，比如免费版是 200 条
  | "thread_img"     // 动态图片数
  | "comment_img"    // 评论图片数


// 在 thread-card 内部消化完成的操作（不需要移除或添加至列表里）
export type ThreadInnerOperation = "comment" | "edit" | "share" | "hourglass"

export type ThreadOutterOperation = "collect" | "emoji" | "delete" | "state" 
  | "restore" | "delete_forever" | "pin" | "float_up"

export type ThreadOperation = ThreadInnerOperation | ThreadOutterOperation

export type ThreadInnerUndo = "undo_hourglass"

export type ThreadOutterUndo = "undo_collect" | "undo_emoji" | "undo_delete"
  | "undo_state" | "undo_pin" | "undo_state"

export type WhyThreadChange = ThreadInnerOperation | ThreadOutterOperation
  | ThreadInnerUndo | ThreadOutterUndo | ""