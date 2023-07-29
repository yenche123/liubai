import { ref, watch } from "vue";
import { TcProps } from "./types";

export function useTcAnimate(
  props: TcProps,
) {

  const cardEl = ref<HTMLElement>()
  const cardHeightPx = ref(150)      // 只在隐藏时进行计算，为其赋值真实的元素高度

  const _calcHeightPx = () => {
    const el = cardEl.value
    if(!el) return
    const info = el.getBoundingClientRect()
    const h = info.height
    if(h) cardHeightPx.value = h
  }

  watch(() => props.showType, (newV) => {
    if(newV === 'hiding') _calcHeightPx()
  })

  return {
    cardEl,
    cardHeightPx,
  }
}