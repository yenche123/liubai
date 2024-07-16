import { onActivated, onDeactivated, ref } from "vue";
import type { ThreadShow } from "~/types/types-content";
import middleBridge from "~/utils/middle-bridge";

export function useDetailContent() {

  const isShowing = ref(true)

  // 接收来自 thread-detail 返回的 threadShow
  const onGetThreadShow = (thread: ThreadShow) => {
    const val = thread.title
    middleBridge.setAppTitle({ val })
  }

  onActivated(() => isShowing.value = true)
  onDeactivated(() => isShowing.value = false)

  return {
    isShowing,
    onGetThreadShow,
  }
}