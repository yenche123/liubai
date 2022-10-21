import { ref, watch } from "vue"
import type { Ref } from "vue"
import { useWindowSize } from "../../../hooks/useVueUse"

export function useCustomEditor() {
  const maxEditorHeight = ref(500)
  
  listenWindowChange(maxEditorHeight)

  return { maxEditorHeight }
}

function listenWindowChange(maxEditorHeight: Ref<number>) {
  let lastWinHeightChange = 0
  const { height } = useWindowSize()

  const whenWindowHeightChange = () => {
    let h = Math.max(height.value - 150, 100)
    maxEditorHeight.value = h
  }

  watch(height, () => {
    if(lastWinHeightChange) clearTimeout(lastWinHeightChange)
    lastWinHeightChange = setTimeout(() => {
      lastWinHeightChange = 0
      whenWindowHeightChange()
    }, 300)
  })

  whenWindowHeightChange()
}