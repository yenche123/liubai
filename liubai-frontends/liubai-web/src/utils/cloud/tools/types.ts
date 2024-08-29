import type { 
  LiuImageStore,
  LiuFileStore,
} from "~/types";
import type { 
  LiuTable, 
  LiuUploadTask,
  SupportedTheme,
  SyncSpeed,
} from "~/types/types-atom";

export interface ImageTransferedRes {
  useCloud: boolean       // check if using cloud image 
                          // which represents that downloading is required
  image?: LiuImageStore
}

export interface FileTransferedRes {
  useCloud: boolean
  file?: LiuFileStore
}


// 下载任务的结构，其中 C2L 为 CloudFiler 的简称
export interface TaskOfC2L {
  table: LiuTable
  id: string
  file_id?: string
}

export type SyncResState = "success" | "bad_network" | "unknown" | "known_err"
  | "opaque"

export interface SyncResult {
  state: SyncResState
  all_states: SyncResState[]
}

export interface UploadTaskParam {
  uploadTask: LiuUploadTask
  target_id: string
  operateStamp: number
}

export interface AddUploadTaskOpt {
  speed?: SyncSpeed
}

/** 主进程向每个子进程发消息时，会传入的数据包 */
export interface MainToChildMessage {
  event: string         // 事件名称
  userId?: string
  token?: string
  serial?: string       // token 所在的序列号
  client_key?: string   // 前端生成的 aes 密钥
  timeDiff: number
  system_language: string
  system_theme: SupportedTheme
  device_string: string
}

export interface CheckDownloadTaskParam {
  tasks: TaskOfC2L[]
  msg: MainToChildMessage
}


export type UploadTaskLocalTable_ID = "content_id" |
  "workspace_id" |
  "member_id" |
  "collection_id"


export interface UpdateImagesRes {
  updated: boolean
  images?: LiuImageStore[]
}

export interface UpdateFilesRes {
  updated: boolean
  files?: LiuFileStore[]
}