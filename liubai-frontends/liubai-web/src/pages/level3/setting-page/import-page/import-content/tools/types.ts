import JSZip from "jszip"
import { LiuFileStore, LiuImageStore } from "~/types"
import type { 
  ThreadShow 
} from "~/types/types-content"
import type {
  ContentLocalTable
} from "~/types/types-table"


export interface LiuJSZip {
  relativePath: string
  file: JSZip.JSZipObject
}

export interface ImportedAtom {
  dateStr?: string
  cardJSON?: JSZip.JSZipObject
  assets?: JSZip.JSZipObject[]
}

// 无需更新、需要更新、全新的
export type ImportedStatus = "no_change" | "update_required" | "new"

export interface ImportedAtom2 {
  id: string
  status: ImportedStatus
  threadShow: ThreadShow
  threadData: ContentLocalTable
}

export interface ImportedAsset {
  arrayBuffer: ArrayBuffer
  name: string
}

export interface ImgsFiles {
  images: LiuImageStore[]
  files: LiuFileStore[]
}