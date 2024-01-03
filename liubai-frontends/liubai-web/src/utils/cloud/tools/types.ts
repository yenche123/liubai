import type { 
  LiuImageStore,
  LiuFileStore,
} from "~/types";
import { type LiuTable } from "~/types/types-atom"

export interface ImageTransferedRes {
  useCloud: boolean
  image?: LiuImageStore
}

export interface FileTransferedRes {
  useCloud: boolean
  file?: LiuFileStore
}


// 下载任务的结构，其中 C2L 为 CloudToLocal 的简称
export interface TaskOfC2L {
  table: LiuTable
  id: string
}

export type DownloadRes = "success" | "bad_network" | "unknown"