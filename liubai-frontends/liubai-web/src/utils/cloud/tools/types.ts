import type { 
  LiuImageStore,
  LiuFileStore,
} from "~/types";
import type { 
  LiuTable, 
  LiuUploadTask,
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


// 下载任务的结构，其中 C2L 为 CloudToLocal 的简称
export interface TaskOfC2L {
  table: LiuTable
  id: string
}

export type DownloadRes = "success" | "bad_network" | "unknown"


export interface UploadTaskParam {
  uploadTask: LiuUploadTask
  target_id: string
  newBool?: boolean      // 同 UploadTaskLocalTable.newBool
  newStr?: string        // 同 UploadTaskLocalTable.newStr
}