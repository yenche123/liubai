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

  watch(() => lpcData.code, (newV, oldV) => {
    whenCodeChange(newV, oldV, lpcData)
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
  newV: string,
  oldV: string,
  lpcData: LpcData,
) {
  const code = newV.trim()

  const len0 = code.length
  const len1 = newV.length
  const len2 = oldV.length
  
  // 1. 先判断是否前后输入了空格，若是，则把它去掉
  if(len1 !== len0) {
    lpcData.code = code
    return
  }

  // 2. 全部转换为大写
  const upCode = code.toUpperCase()
  if(code !== upCode) {
    lpcData.code = upCode
    return
  }

  // 3. 当前有 4 个字符，并且是再新增字符，追加 "-"
  if(len1 === 4) {
    // 若是新增字符，追加 "-"
    if(len1 >= len2) {
      lpcData.code = code + `-`
      return
    }
    // 若是减少字符，则只取 0 到 2 之间的 3 个字符
    if(len1 < len2) {
      lpcData.code = code.substring(0, 3)
      return
    }
  }

  // 4. 若已有字符 >= 5，但是 code 里从没有 "-" 字符时
  if(len1 >= 5 && !code.includes("-")) {
    const str1 = code.substring(0, 4)
    const str2 = code.substring(4, 8)
    lpcData.code = str1 + `-` + str2
    return
  }
  
  const canSubmit = code.length >= 9
  if(lpcData.canSubmit !== canSubmit) {
    lpcData.canSubmit = canSubmit
  }
}