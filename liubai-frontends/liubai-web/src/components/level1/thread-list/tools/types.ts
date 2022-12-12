

export type TlViewType = "TRASH" | "TAG" | "FAVORITE" | "PINNED" | ""

export interface TlProps {
  viewType: string
  tagId: string
}
