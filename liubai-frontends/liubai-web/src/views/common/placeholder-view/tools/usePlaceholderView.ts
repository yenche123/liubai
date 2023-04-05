import { ref, toRef, watch } from "vue"
import type { PageState } from "~/types/types-atom"
import type { Ref } from "vue"
import valTool from "~/utils/basic/val-tool"

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
  let needOpen = newV === 0 || newV >= 2
  
  if(needOpen && enable.value === false) {
    open(enable, show)
  }
  else if(!needOpen && enable.value === true) {
    close(enable, show)
  }
}

async function open(
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

async function close(
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  show.value = false
  await valTool.waitMilli(TRANSITION_MS)
  enable.value = false
}