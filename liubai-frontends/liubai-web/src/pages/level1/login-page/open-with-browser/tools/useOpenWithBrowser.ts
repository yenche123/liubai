import { onMounted, reactive, ref } from "vue"
import liuApi from "~/utils/liu-api"
import type { OwbData } from "./types"
import { useOpenClose } from "~/hooks/useOpenClose"
import { waitWindowLoaded } from "~/utils/wait/wait-window-loaded"
import valTool from "~/utils/basic/val-tool"

export function useOpenWithBrowser() {
  const isOn = ref(false)
  const cha = liuApi.getCharacteristic()
  const owbData = reactive<OwbData>({
    enable: false,
    show: false,
  })
  useOpenClose(isOn, owbData)

  onMounted(async () => {
    if(!cha.isWeChat) return
    await waitWindowLoaded()
    await valTool.waitMilli(500)
    isOn.value = true
  })

  const onTapClose = () => {
    isOn.value = false
  }
  
  return {
    owbData,
    onTapClose,
    cha,
  }
}