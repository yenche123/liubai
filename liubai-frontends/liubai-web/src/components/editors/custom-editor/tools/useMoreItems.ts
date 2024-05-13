import { computed, ref } from "vue";
import type { CeProps } from "./types";

export function useMoreItems(props: CeProps) {
  const moreRef = ref(false)
  
  const onTapMore = () => {
    moreRef.value = !moreRef.value
  }

  const showVirtualBar = computed(() => {
    if(moreRef.value) return true
    return false
  })


  return { moreRef, onTapMore, showVirtualBar }
}