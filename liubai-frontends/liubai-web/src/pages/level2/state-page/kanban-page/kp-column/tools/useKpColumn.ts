import { ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"
import { useLiuWatch } from "~/hooks/useLiuWatch"

export function useKpColumn() {
  const columnHeight = ref(500)
  const { height } = useWindowSize()

  const _cal = () => {
    let h = height.value - cfg.navi_height - cfg.kanban_header_height - 15
    if(h < 100) h = 100
    columnHeight.value = h
  }
  useLiuWatch(height, _cal)

  return {
    columnHeight
  }
}