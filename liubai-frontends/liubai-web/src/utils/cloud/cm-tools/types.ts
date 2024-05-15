import type { SyncGetAtom } from "~/types/types-cloud"
import type { BoolFunc } from "~/utils/basic/type-tool"

export type CmResolver = BoolFunc

export interface CmTask {
  data: SyncGetAtom
  resolver: CmResolver
}