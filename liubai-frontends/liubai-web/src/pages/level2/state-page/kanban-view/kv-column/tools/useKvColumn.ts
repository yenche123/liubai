import { onActivated, onMounted, onUnmounted, ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"
import { useLiuWatch } from "~/hooks/useLiuWatch"
import type { KbListEmits2, KbListProps } from "../../../tools/types"

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
  
  let sv: HTMLElement | null = null
  let lastScrollTop = 0

  const onScrolling = () => {
    if(!sv) return
    lastScrollTop = sv.scrollTop
    emits("scrolling", lastScrollTop)
  }

  onActivated(() => {
    if(lastScrollTop <= 1) return
    if(!sv) return
    sv.scrollTop = lastScrollTop
  })

  onMounted(() => {
    sv = document.querySelector("#kanban-" + props.stateId)
    if(!sv) return
    sv.addEventListener("scroll", onScrolling)
  })

  onUnmounted(() => {
    if(!sv) return
    sv.removeEventListener("scroll", onScrolling)
  })

}