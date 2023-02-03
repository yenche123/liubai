import type { Ref } from "vue"
import { watch } from "vue"
import type { SimpleFunc, AnyFunc } from "~/utils/basic/type-tool"


// 如果 ref.value 有值就触发 foo()，否则等待 ref.value 存在时再去触发 foo()
export function useLiuWatch<T = any, F extends AnyFunc = SimpleFunc>(
  aRef: Ref<T>,
  foo: F,
  deep: boolean = false,
) {
  watch(aRef, (newV) => {
    if(newV) foo()
  }, { deep })
  if(aRef.value) {
    foo()
  }
}