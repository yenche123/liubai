import type { TagShow } from "~/types/types-content"

export interface HsData {
  nonce: string           // 随机字符串
  enable: boolean
  show: boolean
  transDuration: number    // 过度动画的毫秒数
  list: TagShow[]
  originalList: TagShow[]
  canSubmit: boolean
  lastFocusOrBlurStamp: number
}

export interface HsParam {
  tags: TagShow[]
}

export interface HsRes {
  confirm: boolean
  tags?: TagShow[]
}