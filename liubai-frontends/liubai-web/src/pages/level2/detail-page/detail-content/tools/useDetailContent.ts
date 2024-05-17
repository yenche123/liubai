import type { ThreadShow } from "~/types/types-content";
import middleBridge from "~/utils/middle-bridge";

export function useDetailContent() {

  // 接收来自 thread-detail 返回的 threadShow
  const onGetThreadShow = (thread: ThreadShow) => {
    const val = thread.title
    middleBridge.setAppTitle({ val })
  }

  return {
    onGetThreadShow,
  }
}