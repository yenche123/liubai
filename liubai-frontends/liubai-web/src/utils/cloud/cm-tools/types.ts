import type { 
  SyncGetAtom, 
  LiuDownloadParcel,
} from "~/types/cloud/sync-get/types"

export type CmResolver = (list?: LiuDownloadParcel[]) => void

export interface CmTask {
  data: SyncGetAtom
  resolver: CmResolver
}