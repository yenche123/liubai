import { ref, watch } from "vue";
import type { Ref } from "vue";
import { useLayoutStore } from "../../../../views/useLayoutStore";
import { storeToRefs } from "pinia";
import valTool from "../../../../utils/basic/val-tool";

const TRANSITION_DURATION = 150

export function useNaviAuto() {
  
  const enable = ref(false)
  const show = ref(false)
  const layout = useLayoutStore()
  const { sidebarWidth } = storeToRefs(layout)
  watch(sidebarWidth, (newV) => {
    judgeState(enable, show, newV)
  })
  judgeState(enable, show, sidebarWidth.value)

  const onTapMenu = () => {

  }
  
  return {
    TRANSITION_DURATION,
    enable,
    show,
    onTapMenu,
  }
}

function judgeState(
  enable: Ref<boolean>,
  show: Ref<boolean>,
  sidebarWidth: number,
) {
  console.log("judgeState sidebarWidth: ")
  console.log(sidebarWidth)
  console.log(" ")
  if(sidebarWidth > 0) _close(enable, show)
  else _open(enable, show)
}

async function _open(
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

async function _close(
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  if(!enable.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
}


