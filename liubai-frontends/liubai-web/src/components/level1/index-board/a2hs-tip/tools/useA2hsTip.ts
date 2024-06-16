import { reactive, toRef } from "vue";
import type { A2hsTipProps, AtData } from "./types";
import { useOpenClose } from "~/hooks/useOpenClose";


export function useA2hsTip(props: A2hsTipProps) {
  const atData = reactive<AtData>({
    enable: false,
    show: false,
  })

  const isOn = toRef(props, "a2hs")
  useOpenClose(isOn, atData)

  return {
    atData,
  }
}