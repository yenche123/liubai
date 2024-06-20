import { storeToRefs } from "pinia";
import { ref, watch } from "vue";
import cfg from "~/config";
import { useWindowSize } from "~/hooks/useVueUse";
import { useLayoutStore } from "~/views/useLayoutStore";
import sideBar from "~/views/side-bar";
import { type NaviBarProps } from "./types";

export function useNaviBar(props: NaviBarProps) {
  const showMenuBtn = ref(false)

  const { width } = useWindowSize()
  const layout = useLayoutStore()
  const { sidebarWidth } = storeToRefs(layout)

  const _judge = () => {
    const w1 = width.value
    const w2 = sidebarWidth.value
    const oldV = showMenuBtn.value

    let newV = false
    if(w1 < cfg.sidebar_close_point) newV = true
    if(w1 < cfg.sidebar_open_point && w2 <= 0) newV = true

    if(props.showMenu) {
      if(newV !== oldV) showMenuBtn.value = newV
    }
  }

  watch([sidebarWidth, width], () => {
    _judge()
  }, { immediate: true })

  const onTapMenu = () => {
    sideBar.showFixedSideBar()
  }

  return {
    showMenuBtn,
    onTapMenu,
  }
}