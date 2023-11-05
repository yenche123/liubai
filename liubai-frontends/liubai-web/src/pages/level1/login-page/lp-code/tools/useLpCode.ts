import { reactive, ref, watch } from "vue"
import type { LpcProps, LpcEmits, LpcData } from "./types"

export function useLpCode(
  props: LpcProps,
  emit: LpcEmits,
) {
  const lpCodeInput = ref<HTMLInputElement>()
  const lpcData = reactive<LpcData>({
    code: "",
    canSubmit: false,
  })

  watch(() => lpcData.code, () => {
    whenCodeChange(lpcData)
  })
  
  const onEnterCode = () => {

  }

  return {
    lpCodeInput,
    lpcData,
    onEnterCode,
  }
}

function whenCodeChange(
  lpcData: LpcData
) {
  const code = lpcData.code
  const code2 = code.trim()
  if(code.length !== code2.length) {
    lpcData.code = code2
    return
  }

  const canSubmit = code2.length >= 8
  if(lpcData.canSubmit !== canSubmit) {
    lpcData.canSubmit = canSubmit
  }
}