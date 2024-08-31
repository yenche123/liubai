import { 
  useWindowSize as vueUseWindowSize, 
  useNetwork as vueUseNetwork,
  useResizeObserver,
  useDropZone,
  usePageLeave,
  useIdle,
  useThrottleFn,
  useDebounceFn,
  useDocumentVisibility,
  useMutationObserver,
  useScreenOrientation,
} from "@vueuse/core"
import { useQRCode } from "@vueuse/integrations/useQRCode"
import type { NetworkState } from "@vueuse/core"

const useWindowSize = () => {
  const res = vueUseWindowSize()
  return res
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
  useIdle,
  useMutationObserver,

  // 【节流函数】在特定周期（毫秒内）只触发一次
  // 若该周期内没有触发过，则马上去触发
  // 否则直接忽略调用
  useThrottleFn,

  // 【防抖函数】短时间多次触发，只在最后一次等待若干 ms 后触发
  useDebounceFn,

  // 监听浏览器分页当前是否可见
  useDocumentVisibility,

  useQRCode,

  useScreenOrientation,
}