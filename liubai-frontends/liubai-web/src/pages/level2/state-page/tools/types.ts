import type { KanbanColumn } from "~/types/types-content"

export type StateWhichPage = 0 | 1 | 2

export interface SnIndicatorData {
  width: string
  left: string
}

export interface KanbanData {
  name: string
  columns: KanbanColumn[]
}