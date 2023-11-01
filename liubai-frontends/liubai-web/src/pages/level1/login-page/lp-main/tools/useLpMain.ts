import { onMounted, reactive, ref, watch } from "vue";
import type { LpmData } from "./types"
import liuUtil from '~/utils/liu-util';
import { useWindowSize } from "~/hooks/useVueUse";
import { LiuTimeout } from "~/utils/basic/type-tool";

export function useLpMain() {

  const lpSelectsEl = ref<HTMLElement>()
  const lpmData = reactive<LpmData>({
    current: 2,
    showEmailSubmit: false,
    indicatorData: {
      width: "0px",
      left: "0px",
    }
  })

  const onTapSelect = (newIndex: number) => {
    if(lpmData.current === newIndex) return
    lpmData.current = newIndex
  }

  const calculateIndicator = () => {
    const parentEl = lpSelectsEl.value
    if(!parentEl) return
    const newIndex = lpmData.current
    const q = `.lps-item-${newIndex}`
    const childEl = parentEl.querySelector(q)
    if(!childEl) return
    const info = liuUtil.getIndicatorLeftAndWidth(parentEl, childEl)
    if(!info) return
    console.log(`info: `, info)
    lpmData.indicatorData = info
  }

  watch(() => lpmData.current, (newV) => {
    calculateIndicator()
  })
  onMounted(() => {
    calculateIndicator()
  })

  let widthTimeout: LiuTimeout
  const { width } = useWindowSize()
  watch(width, (newV) => {
    if(widthTimeout) clearTimeout(widthTimeout)
    widthTimeout = setTimeout(() => {
      widthTimeout = undefined
      calculateIndicator()
    }, 200)
  })

  
  return {
    lpSelectsEl,
    lpmData,
    onTapSelect,
  }
}