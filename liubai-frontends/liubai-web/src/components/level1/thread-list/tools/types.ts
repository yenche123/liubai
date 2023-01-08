

export type TlViewType = "TRASH" | "TAG" | "FAVORITE" | "PINNED" | ""

export interface TlProps {
  viewType: string
  tagId: string
}

export type TlDisplayType = "list" | "detail"

export type ThreadOperation = "collect" | "emoji" | "share" | "comment"
  | "edit" | "delete" | "state" | "restore" | "delete_forever"
