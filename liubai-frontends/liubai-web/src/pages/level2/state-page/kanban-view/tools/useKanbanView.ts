import { useScrollViewElement } from "~/hooks/elements/useScrollViewElement"

export function useKanbanView() {
  useScrollViewElement(`#state-page-kv-column-container`, { isTop: false })
}