import type { LiuFileAndImage } from "~/types"

export type UploadResolver = (res: string | false) => void

export interface UploadFileAtom {
  taskId: string
  contentId?: string
  files: LiuFileAndImage[]
}