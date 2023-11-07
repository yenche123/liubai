import { reactive } from "vue";
import type { LpaData, LpaEmit, LpaProps } from "./types"

export function useLpAccounts(
  props: LpaProps,
  emit: LpaEmit,
) {

  const lpaData = reactive<LpaData>({
    selectedIndex: -1,
  })

  const onTapItem = (idx: number) => {
    lpaData.selectedIndex = idx
  }

  const onTapConfirm = () => {
    const idx = lpaData.selectedIndex
    if(idx < 0) return
    emit("confirm", idx)
  }

  return {
    lpaData,
    onTapItem,
    onTapConfirm,
  }
  
}