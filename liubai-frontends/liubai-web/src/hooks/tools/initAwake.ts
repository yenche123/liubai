// listen to page visible after a while

import liuEnv from "~/utils/liu-env";
import { useActiveSyncNum } from "../useCommon";
import { ref, watch } from "vue";
import { useSystemStore } from "../stores/useSystemStore";
import {
  useDocumentVisibility,
  useThrottleFn,
  useWindowFocus,
} from "~/hooks/useVueUse";
import time from "~/utils/basic/time";
import liuUtil from "~/utils/liu-util";

export function initAwake() {
  const hasBE = liuEnv.hasBackend()
  if(hasBE) {
    initAwakeWithBackend()
  }
  else {
    initAwakeWithoutBackend()
  }
}


function initAwakeWithBackend() {
  const { activeSyncNum} = useActiveSyncNum()
  watch(activeSyncNum, (newV) => {
    if(newV <= 1) return
    const sStore = useSystemStore()
    sStore.checkTheme()
  })
}

function initAwakeWithoutBackend() {
  const visibility = useDocumentVisibility()
  const focused = useWindowFocus()
  const awakeNum = ref(0)

  const _whenAwaken = useThrottleFn(() => {
    const sStore = useSystemStore()
    sStore.checkTheme()
  }, time.MINUTE)

  watch(awakeNum, (newV) => {
    const justLaunched = liuUtil.check.isJustAppSetup()
    if(justLaunched) return
    _whenAwaken()
  })

  /**
   * 在 macOS 上，使用 cmd + Tab 切换应用时，
   * visibility 不会变化，只有 focused 会变化
   * 所以才需要同时监听 visibility 和 focused
   */
  watch([visibility, focused], (
    [newV1, newV2],
    [oldV1, oldV2],
  ) => {
    console.log("visibility: ", newV1, "  focused: ", newV2)
    if(newV1 !== "visible" || !newV2) return
    awakeNum.value++
  })
}