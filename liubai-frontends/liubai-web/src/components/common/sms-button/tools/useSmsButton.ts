import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import type { SmsStatus } from "~/types/types-view";
import type { LiuInterval } from "~/utils/basic/type-tool";
import type { SmsButtonEmit } from "./types";

let lastSec = 60

export function useSmsButton(
  status: Ref<SmsStatus>,
  emit: SmsButtonEmit,
) {

  const sec = ref(lastSec)
  let timer: LiuInterval

  const _stopCounting = () => {
    if(timer) {
      clearInterval(timer)
    }
    timer = undefined
    sec.value = 60
    lastSec = 60
  }

  const _startToCount = () => {
    if(timer) {
      clearInterval(timer)
    }
    timer = setInterval(() => {
      const newSec = sec.value - 1
      if(newSec < 0) {
        _stopCounting()
        status.value = "can_tap"
        return
      }
      sec.value = newSec
      lastSec = newSec
    }, 1000)
  }

  watch(status, (newV, oldV) => {
    if(oldV === "can_tap" || oldV === "loading") {
      if(newV === "counting") {
        _startToCount()
      }
    }
  })

  onMounted(() => {
    if(status.value === "counting") {
      _startToCount()
    }
  })

  onBeforeUnmount(() => {
    if(timer) {
      clearInterval(timer)
      timer = undefined
    }
  })

  const onTapButton = () => {
    if(status.value === "can_tap") {
      emit("click")
    }
  }

  return {
    sec,
    onTapButton,
  }
}