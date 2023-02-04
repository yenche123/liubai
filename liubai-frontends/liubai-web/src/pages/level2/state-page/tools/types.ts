import type { KanbanColumn, ThreadShow } from "~/types/types-content"

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

export interface KbListProps {
  threads: ThreadShow[]
}