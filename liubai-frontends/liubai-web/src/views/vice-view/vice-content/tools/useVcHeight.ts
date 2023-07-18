import { ref, watch } from "vue";
import { useWindowSize } from "~/hooks/useVueUse";
import cfg from "~/config"
import type { LiuTimeout } from "~/utils/basic/type-tool";

export function useVcHeight() {
  let timeout: LiuTimeout
  const vcHeight = ref(0)     // 等于窗口的高度
  const vcHeight2 = ref(0)    // 窗口高度 扣除 导航栏的高度
  const maskMarginTop = ref(0)
  const viceNaviPx = cfg.vice_navi_height

  const { height } = useWindowSize()
  const _calc = () => {
    const h = Math.ceil(height.value)
    const tmp = Math.ceil(height.value - cfg.vice_navi_height)

    vcHeight.value = h
    vcHeight2.value = tmp
    maskMarginTop.value = (-tmp)
  }

  const whenWindowChange = () => {
    if(vcHeight.value === 0 || vcHeight2.value === 0) {
      _calc()
      return
    }

    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      _calc()
    }, 250)
  }

  watch(height, (newV) => {
    whenWindowChange()
  }, { immediate: true })

  return {
    vcHeight,
    vcHeight2,
    maskMarginTop,
    viceNaviPx,
  }
}