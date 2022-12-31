import type { ThreadShow } from "../../../../types/types-content"
import type { WorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore"
import type { RouteAndLiuRouter } from "../../../../routes/liu-router"
import type { PageState } from "../../../../types/types-atom";

export interface TdData {
  state: PageState
  threadShow: ThreadShow | undefined
}

type TdLocation = "vice-view" | "detail-page"

export interface TdProps {
  location: TdLocation
}

export interface ToidCtx {
  wStore: WorkspaceStore
  userId?: string
  thread: ThreadShow
  rr: RouteAndLiuRouter
}