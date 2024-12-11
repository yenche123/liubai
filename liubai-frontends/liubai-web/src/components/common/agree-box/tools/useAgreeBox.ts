import type { Ref } from "vue";
import { ref, toRef, watch } from 'vue';
import valTool from '~/utils/basic/val-tool';
import type { AgreeBoxProps } from "./types";
import liuApi from "~/utils/liu-api";

export function useAgreeBox(
  agree: Ref<boolean>,
  props: AgreeBoxProps,
) {

  const onTapBox = () => {
    agree.value = !agree.value
  }

  const isShaking = ref(false)
  const _toShake = async () => {
    if(isShaking.value) return
    isShaking.value = true
    liuApi.vibrate([100, 100, 100, 100, 100, 100, 100])
    await valTool.waitMilli(888)
    isShaking.value = false
  }

  const shakingNum = toRef(props, "shakingNum")
  watch(shakingNum, (newV, oldV) => {
    if(newV > oldV) {
      _toShake()
    }
  })
  
  return {
    isShaking,
    onTapBox,
  }
}