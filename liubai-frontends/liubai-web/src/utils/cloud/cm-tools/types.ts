import type { 
  SyncGetAtom, 
  LiuDownloadParcel,
} from "~/types/cloud/sync-get/types"
import type { DexieBulkUpdateAtom } from "~/types/other/types-dexie"
import type { 
  CollectionLocalTable, 
  ContentLocalTable,
} from "~/types/types-table"

export type CmResolver = (list?: LiuDownloadParcel[]) => void

export interface CmTask {
  data: SyncGetAtom
  resolver: CmResolver
}

export type Bulk_Content = DexieBulkUpdateAtom<ContentLocalTable>
export type Bulk_Collection = DexieBulkUpdateAtom<CollectionLocalTable>