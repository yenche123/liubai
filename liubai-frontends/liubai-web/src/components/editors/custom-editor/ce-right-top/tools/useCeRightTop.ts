import { reactive, toRef, watch } from "vue";
import type { CrtData, CrtProps } from "./types";
import valTool from "~/utils/basic/val-tool";
import liuUtil from "~/utils/liu-util";

const TRANSITION_MS = 300

export function useCeRightTop(props: CrtProps) {

  const crtData = reactive<CrtData>({
    enable: false,
    show: false,
  })

  const showRightTop = toRef(props, "showRightTop")
  watch(showRightTop, (newV) => {
    if(newV) _open(crtData)
    else _close(crtData)
  })

  return {
    TRANSITION_MS,
    crtData,
  }
}

async function _open(
  crtData: CrtData,
) {
  if(crtData.show) return
  crtData.enable = true
  await liuUtil.waitAFrame()
  if(crtData.enable) {
    crtData.show = true
  }
}

async function _close(
  crtData: CrtData,
) {
  if(!crtData.enable) return
  crtData.show = false
  await valTool.waitMilli(TRANSITION_MS)
  if(!crtData.show) {
    crtData.enable = false
  }
}