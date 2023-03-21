
import { provide, ref } from "vue"
import liuUtil from "~/utils/liu-util"
import { viceViewWidthKey } from "../utils/provide-keys"

export function useMainVice() {
  const viceViewPx = ref(0)
  const hiddenScrollBar = ref(false)
  const onVvWidthChange = (val: number) => {
    viceViewPx.value = val

    const hsb = hiddenScrollBar.value
    if(val > 0 && !hsb) hiddenScrollBar.value = true
    else if(val <= 0 && hsb) hiddenScrollBar.value = false
  }

  // 会在每个 page 中注入，而非 vice-view 中；因为 main-view 需要得知该值再进行计算
  // 而 main-view 和 vice-view 却是兄弟组件，故才需要在它们的上级 page 中注入
  provide(viceViewWidthKey, viceViewPx)


  // 当点击右小角的 FAB 时，给 goToTop +1 以通知 scroll-view 滚动到顶部
  const goToTop = ref(0)
  const onTapFab = () => {
    if(!liuUtil.canTap()) return
    goToTop.value++
  }
  
  // scoll-view 的 onScroll 事件，可以得知当前滚动的位置，好让 FAB 判断展开/隐藏状态
  const scrollPosition = ref(0)
  const onScroll = (data: { scrollPosition: number }) => {
    scrollPosition.value = data.scrollPosition
  }

  return { 
    hiddenScrollBar, 
    onVvWidthChange,
    goToTop,
    onTapFab,
    scrollPosition,
    onScroll,
  }
}