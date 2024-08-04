import { ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"
import { useLiuWatch } from "~/hooks/useLiuWatch"
import type { KbListEmits2, KbListProps } from "../../../tools/types"
import { useScrollViewElement } from "~/hooks/elements/useScrollViewElement"

export function useKvColumn(
  props: KbListProps,
  emits: KbListEmits2
) {
  const columnHeight = ref(500)
  const { height } = useWindowSize()

  const _cal = () => {
    let h = height.value - cfg.navi_height - cfg.kanban_header_height - 18
    if(h < 100) h = 100
    columnHeight.value = h
  }
  useLiuWatch(height, _cal)

  handleScrollView(props, emits)

  return {
    columnHeight,
  }
}

function handleScrollView(
  props: KbListProps,
  emits: KbListEmits2
) {
  const selectors = `#kanban-${props.stateId}`
  const onScrolling = (sT: number) => {
    emits("scrolling", sT)
  }

  useScrollViewElement(selectors, { onScrolling })
}