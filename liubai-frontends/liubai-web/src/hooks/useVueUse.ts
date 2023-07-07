import { 
  useWindowSize as vueUseWindowSize, 
  useNetwork as vueUseNetwork,
  useResizeObserver,
  useDropZone,
  usePageLeave,
} from "@vueuse/core"
import type { NetworkState } from "@vueuse/core"
import type { Ref } from "vue"

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

let networkState: NetworkState | null = null
const useNetwork = (): Readonly<NetworkState> => {
  if(!networkState) {
    networkState = vueUseNetwork()
  }
  return networkState
}

export {
  useWindowSize,
  useResizeObserver,
  useDropZone,
  useNetwork,
  usePageLeave,
}