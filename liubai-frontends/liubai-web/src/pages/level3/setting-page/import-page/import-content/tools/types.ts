import type { JSZipObject } from "jszip"
import type { LiuFileStore, LiuImageStore } from "~/types"
import type { 
  CommentShow,
  ThreadShow 
} from "~/types/types-content"
import type {
  ContentLocalTable
} from "~/types/types-table"


export interface LiuJSZip {
  relativePath: string
  file: JSZipObject
}

export interface ImportedAtom {
  dateStr?: string
  cardJSON?: JSZipObject
  assets?: JSZipObject[]
}

// 无需更新、需要更新、全新的
export type ImportedStatus = "no_change" | "update_required" | "new"

export interface ImportedAtom2 {
  id: string
  status: ImportedStatus
  threadShow?: ThreadShow
  commentShow?: CommentShow
  contentData: ContentLocalTable
}

export interface ImportedAsset {
  arrayBuffer: ArrayBuffer
  name: string
}

export interface ImgsFiles {
  images: LiuImageStore[]
  files: LiuFileStore[]
}