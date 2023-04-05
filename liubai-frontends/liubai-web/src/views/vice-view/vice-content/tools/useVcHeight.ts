import { ref, watch } from "vue";
import { useWindowSize } from "~/hooks/useVueUse";
import cfg from "~/config"
import type { LiuTimeout } from "~/utils/basic/type-tool";

export function useVcHeight() {
  let timeout: LiuTimeout
  const vcHeight = ref(0)
  const maskMarginTop = ref(0)

  const { height } = useWindowSize()
  const _calc = () => {
    const tmp = Math.ceil(height.value - cfg.vice_navi_height)
    vcHeight.value = tmp
    maskMarginTop.value = (-tmp) - 8
  }

  const whenWindowChange = () => {
    if(vcHeight.value === 0) {
      _calc()
      return
    }

    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      _calc()
    }, 300)
  }

  watch(height, (newV) => {
    whenWindowChange()
  }, { immediate: true })

  return {
    vcHeight,
    maskMarginTop,
  }
}