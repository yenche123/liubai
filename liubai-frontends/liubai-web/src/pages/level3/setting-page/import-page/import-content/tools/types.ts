import JSZip from "jszip"
import type { 
  ThreadShow 
} from "~/types/types-content"
import type {
  ContentLocalTable
} from "~/types/types-table"

export interface ImportedAtom {
  dateStr?: string
  cardJSON?: JSZip.JSZipObject
  assets?: JSZip.JSZipObject[]
}

export interface ImportedAtom2 {
  id: string
  status: "no_change" | "update_required" | "new"         // 无需更新、需要更新、全新的
  threadShow: ThreadShow
  threadData: ContentLocalTable
}