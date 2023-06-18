import type { CommentShow, ThreadShow } from "~/types/types-content";
import type { SimpleFunc } from "~/utils/basic/type-tool"

export interface ContentPanelParam {
  thread?: ThreadShow
  comment?: CommentShow
  onlyReaction?: boolean   // 仅在 comment 有值且 thread 没有值时生效，表示是否只展示表态面板
}

export interface ContentPanelData {
  thread?: ThreadShow
  comment?: CommentShow
  onlyReaction: boolean
  enable: boolean
  show: boolean
}


// 返回的 resolver 不带任何参数，只告知外部弹窗已关闭
// 为什么不用回传组件内发生的事件呢？
// 因为会用全局的 hook (store) 统一告知外部
export type ContentPanelResolver = SimpleFunc