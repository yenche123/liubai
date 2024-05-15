import type { SyncGetAtom } from "~/types/types-cloud"
import type { LiuDownloadParcel } from "~/requests/req-types"

export type CmResolver = (list?: LiuDownloadParcel[]) => void

export interface CmTask {
  data: SyncGetAtom
  resolver: CmResolver
}