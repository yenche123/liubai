import { reactive } from "vue";
import type { LpaData, LpaEmit, LpaProps } from "./types"
import { useKeyboard } from "~/hooks/useKeyboard";

export function useLpAccounts(
  props: LpaProps,
  emit: LpaEmit,
) {

  const lpaData = reactive<LpaData>({
    selectedIndex: -1,
  })

  const onTapItem = (idx: number) => {
    if(idx === lpaData.selectedIndex) idx = -1
    lpaData.selectedIndex = idx
  }

  const onTapConfirm = () => toEnter(emit, lpaData)

  listenKeyboard(props, emit, lpaData)

  return {
    lpaData,
    onTapItem,
    onTapConfirm,
  }
  
}


function toEnter(
  emit: LpaEmit,
  lpaData: LpaData,
) {
  const idx = lpaData.selectedIndex
  if(idx < 0) return
  console.log("去提交........")
  emit("confirm", idx)
}

function listenKeyboard(
  props: LpaProps,
  emit: LpaEmit,
  lpaData: LpaData,
) {

  const _canPress = () => {
    if(!props.isShown) return false
    if(props.accounts.length < 1) return false
    return true
  }

  const _upSideDown = (delta: number) => {
    const idx = lpaData.selectedIndex
    const len = props.accounts.length
    let newIdx = idx + delta
    if(newIdx >= len) newIdx = -1
    else if(newIdx < -1) newIdx = len - 1
    lpaData.selectedIndex = newIdx
  }

  const whenKeyUp = (e: KeyboardEvent) => {
    if(!_canPress()) return
    const key = e.key
    if(key === "ArrowDown") {
      _upSideDown(1)
    }
    else if(key === "ArrowUp") {
      _upSideDown(-1)
    }
    else if(key === "Enter") {
      toEnter(emit, lpaData)
    }
  }

  useKeyboard({ whenKeyUp })
}