import { ref, toRef, watch } from "vue"
import type { PageState } from "~/types/types-atom"
import type { PvProps } from "./types"
import type { Ref } from "vue"
import { pageStates } from "~/utils/atom"
import liuUtil from "~/utils/liu-util"
import type { LiuTimeout } from "~/utils/basic/type-tool"
import cfg from "~/config"


export const TRANSITION_MS = 300

export function usePlaceholderView(props: PvProps) {
  const enable = ref(true)
  const show = ref(true)
  const pState = toRef(props, "pState")
  watch(pState, (newV) => {
    whenPStateChange(newV, enable, show)
  }, { immediate: true })

  return {
    enable,
    show,
  }
}

function whenPStateChange(
  newV: PageState,
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  let needOpen = newV === pageStates.LOADING || newV >= pageStates.NO_DATA
  const { isOpening, isClosing } = liuUtil.view.getOpeningClosing(enable, show)
  
  if(needOpen && !isOpening) {
    open(enable, show)
  }
  else if(!needOpen && !isClosing) {
    close(enable, show)
  }
}


let toggleTimeout: LiuTimeout
async function open(
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  if(show.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  enable.value = true
  toggleTimeout = setTimeout(() => {
    show.value = true
  }, cfg.frame_duration)
}

async function close(
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  if(!enable.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  show.value = false
  toggleTimeout = setTimeout(() => {
    enable.value = false
  }, TRANSITION_MS)
}