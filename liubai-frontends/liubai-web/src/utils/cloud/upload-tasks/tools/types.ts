import type { LiuRqReturn } from "~/requests/tools/types"
import type { LiuFileAndImage } from "~/types"
import type { Res_WebhookQiniu } from "~/requests/req-types"
import type { DexieBulkUpdateAtom } from "~/types/other/types-dexie";
import type { UploadTaskLocalTable } from "~/types/types-table";

export type FileReqReturn = LiuRqReturn<Res_WebhookQiniu>

export type UploadResolver = (res: FileReqReturn | null) => void

export interface UploadFileAtom {
  taskId: string
  contentId?: string
  memberId?: string    // for example, the user updates his or her avatar
  draftId?: string     // for example, a draft including files has been updated
  files: LiuFileAndImage[]
}

export type WhenAFileCompleted = (
  fileId: string, res: FileReqReturn
) => void

export type UploadFileRes = "completed" | 
  "partial_success" | 
  "no_space" |
  "too_frequent" |
  "network_err" |
  "other_err"


export type BulkUpdateAtom_UploadTask = DexieBulkUpdateAtom<UploadTaskLocalTable>
