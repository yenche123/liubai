import type { Ref, InjectionKey } from "vue"
import type { KanbanColumn, ThreadShow } from "~/types/types-content"
import type { SimpleFunc } from "~/utils/basic/type-tool"

// 0: 未知    1: 列表    2: 看板
export type StateWhichPage = 0 | 1 | 2

export interface SnIndicatorData {
  width: string
  left: string
}

export interface KanbanData {
  name: string
  columns: KanbanColumn[]
}

export interface KanbanEmits {
  (event: "tapnavi", index: StateWhichPage): void
  (event: "update:kanbanColumns", val: KanbanColumn[]): void
}

export interface KanbanProps {
  current: number
  kanbanColumns: KanbanColumn[]
}

export interface KbListEmits {
  (event: "update:threads", val: ThreadShow[]): void
}

export interface KbListEmits2 extends KbListEmits {
  (event: "scrolling", val: number): void
}

export interface KbListProps {
  threads: ThreadShow[]
  stateId: string
}

export interface ColumnInsertData {
  newIndex: number
  value: ThreadShow
}

export interface StatePageCtx {
  showReload: Ref<boolean>
  kanban: KanbanData
}

export interface StateProvideData {
  showReload: Ref<boolean>
  tapreload: SimpleFunc
  tapaddstate: SimpleFunc
}

export const StateProvideKey = Symbol() as InjectionKey<StateProvideData>