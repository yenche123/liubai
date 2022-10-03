import { 
  useWindowSize as vueUseWindowSize, 
  useResizeObserver 
} from "@vueuse/core"
import { Ref } from "vue"

let winWidth: Ref<number> | null = null
let winHeight: Ref<number> | null = null
const useWindowSize = () => {
  if(!winWidth || !winHeight) {
    let { width, height } = vueUseWindowSize()
    winWidth = width
    winHeight = height
  }
  return { width: winWidth, height: winHeight }
}

export {
  useWindowSize,
  useResizeObserver,
}