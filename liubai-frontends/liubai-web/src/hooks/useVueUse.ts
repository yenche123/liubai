import { 
  useWindowSize as vueUseWindowSize, 
  useNetwork as vueUseNetwork,
  useResizeObserver,
  useDropZone,
  usePageLeave,
  useThrottleFn,
  useDebounceFn,
  useDocumentVisibility,
  useMutationObserver,
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
  useMutationObserver,

  // 【节流函数】在特定周期（毫秒内）只触发一次
  // 若该周期内没有触发过，则马上去触发
  // 否则直接忽略调用
  useThrottleFn,

  // 【防抖函数】短时间多次触发，只在最后一次等待若干 ms 后触发
  useDebounceFn,

  // 监听浏览器分页当前是否可见
  useDocumentVisibility,
}