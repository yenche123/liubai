

export type TlViewType = "TRASH" | "TAG" | "FAVORITE" | "PINNED" | ""

export interface TlProps {
  viewType: string
  tagId: string
}

export type TlDisplayType = "list" | "detail"

// 在 thread-card 内部消化完成的操作（不需要移除或添加至列表里）
export type ThreadInnerOperation = "comment" | "edit" | "share"

export type ThreadOutterOperation = "collect" | "emoji" | "delete" | "state" 
  | "restore" | "delete_forever" | "pin"

export type ThreadOperation = ThreadInnerOperation | ThreadOutterOperation
