import { useScrollViewElement } from "~/hooks/elements/useScrollViewElement"

export function useListView() {
  useScrollViewElement(`#state-page-lv-container`)
}