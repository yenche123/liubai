import { reactive, toRef } from "vue";
import type { CrtData, CrtProps } from "./types";
import { useOpenClose } from "~/hooks/useOpenClose";

const TRANSITION_MS = 300

export function useCeRightTop(props: CrtProps) {

  const crtData = reactive<CrtData>({
    enable: false,
    show: false,
  })

  const isOn = toRef(props, "showRightTop")
  useOpenClose(isOn, crtData, { duration: TRANSITION_MS })

  return {
    TRANSITION_MS,
    crtData,
  }
}