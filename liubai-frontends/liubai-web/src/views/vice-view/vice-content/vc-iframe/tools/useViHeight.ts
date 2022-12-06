import { ref, watch } from "vue";
import { useWindowSize } from "../../../../../hooks/useVueUse";
import cfg from "../../../../../config"

export function useViHeight() {
  let timeout = 0
  const iframeHeight = ref(0)
  const maskMarginTop = ref(0)

  const { height } = useWindowSize()
  const _calc = () => {
    const tmp = Math.ceil(height.value - cfg.vice_navi_height)
    iframeHeight.value = tmp
    maskMarginTop.value = (-tmp) - 5
  }

  const whenWindowChange = () => {
    if(iframeHeight.value === 0) {
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
  })
  whenWindowChange()

  return {
    iframeHeight,
    maskMarginTop,
  }
}