
import liuApi from "~/utils/liu-api";
import type { CommentCardProps } from "./types";
import { ref } from "vue"

export function useCcMouse(
  props: CommentCardProps,
) {

  const cha = liuApi.getCharacteristic()
  const { isMobile } = cha
  const isMouseEnterTarget = ref(isMobile)

  const onMouseEnterTarget = () => {
    if(isMobile) return
    isMouseEnterTarget.value = true
  }

  const onMouseLeaveTarget = () => {
    if(isMobile) return
    isMouseEnterTarget.value = false
  }

  return {
    isMouseEnterTarget,
    onMouseEnterTarget,
    onMouseLeaveTarget,
  }
}