// listen to page visible after a while

import liuEnv from "~/utils/liu-env";
import { useActiveSyncNum } from "../useCommon";
import { watch } from "vue";
import { useSystemStore } from "../stores/useSystemStore";
import time from "~/utils/basic/time";

const MIN_3 = 3 * time.MINUTE

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
  setInterval(() => {
    const sStore = useSystemStore()
    sStore.checkTheme()
  }, MIN_3)
}