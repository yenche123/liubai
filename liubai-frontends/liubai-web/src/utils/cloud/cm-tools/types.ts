import type { Param_SyncGet } from "~/types/types-cloud"
import type { BoolFunc } from "~/utils/basic/type-tool"

export type CmResolver = BoolFunc

export interface CmTask {
  data: Param_SyncGet
  resolver: CmResolver
}