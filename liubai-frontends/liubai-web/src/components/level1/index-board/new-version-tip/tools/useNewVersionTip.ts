import { reactive, toRef } from "vue";
import type { NvtProps, NvtData } from "./types";
import { useOpenClose } from "~/hooks/useOpenClose";


export function useA2hsTip(props: NvtProps) {
  const nvtData = reactive<NvtData>({
    enable: false,
    show: false,
  })

  const isOn = toRef(props, "expand")
  useOpenClose(isOn, nvtData)

  return {
    nvtData,
  }
}