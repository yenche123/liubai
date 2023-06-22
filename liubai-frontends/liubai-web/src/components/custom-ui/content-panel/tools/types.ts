import type { CommentShow, ThreadShow } from "~/types/types-content";

export interface ContentPanelParam {
  thread?: ThreadShow
  comment?: CommentShow
  onlyReaction?: boolean   // 仅在 comment 有值且 thread 没有值时生效，表示是否只展示表态面板
                           // 若是 thread 有值的情况，此值会为 true
}

export interface CpEmoji {
  emoji: string      // 无需 encode
  iconName: string
  shadow: string
  currentFilter?: string   // 当前 emoji 的 filter；
                           // 当鼠标悬浮其上时，currentFilter 会被修改成 shadow
}

export interface ContentPanelData {
  thread?: ThreadShow
  comment?: CommentShow
  onlyReaction: boolean
  enable: boolean
  show: boolean
  emojiList: CpEmoji[]
  isMine: boolean    // 若为 true，展示 "删除按钮"，否则展示 "举报按钮"
}


// 返回的 resolver 不带任何参数，只告知外部弹窗已关闭
// 为什么不用回传组件内发生的事件呢？
// 因为会用全局的 hook (store) 统一告知外部
export type ContentPanelResolver = (res: true) => void