import type { WorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { UseSystemType } from "~/hooks/stores/useSystemStore";

export interface PackThreadOpt {
  wStore: WorkspaceStore
  windowWidth: number
  sStore: UseSystemType
  user_id?: string
}