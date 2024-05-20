import { ref, toRef, watch } from "vue"
import type { PageState } from "~/types/types-atom"
import type { Ref } from "vue"
import valTool from "~/utils/basic/val-tool"
import { pageStates } from "~/utils/atom"
import liuUtil from "~/utils/liu-util"

interface PvProps {
  pState: PageState
  errTitle: string
  errMsg: string
}

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
    show
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

async function open(
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  if(show.value) return
  enable.value = true

  await liuUtil.waitAFrame()

  if(!enable.value) return
  show.value = true
}

async function close(
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  if(!enable.value) return
  show.value = false
  
  await valTool.waitMilli(TRANSITION_MS)

  if(show.value) return
  enable.value = false
}