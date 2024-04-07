import type { LiuRqReturn } from "~/requests/tools/types"
import type { LiuFileAndImage } from "~/types"
import type { Res_WebhookQiniu } from "~/requests/req-types"

export type FileReqReturn = LiuRqReturn<Res_WebhookQiniu>

export type UploadResolver = (res: FileReqReturn | null) => void

export interface UploadFileAtom {
  taskId: string
  contentId?: string
  files: LiuFileAndImage[]
}

export type WhenAFileCompleted = (
  fileId: string, res: FileReqReturn
) => void

export type UploadFileRes = "completed" | "partial_success" | "failed"