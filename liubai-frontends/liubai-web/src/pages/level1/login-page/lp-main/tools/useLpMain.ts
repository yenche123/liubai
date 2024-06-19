import { onMounted, reactive, ref, watch } from "vue";
import type { LpmProps, LpmData, LpmEmit } from "./types"
import liuUtil from '~/utils/liu-util';
import { useWindowSize } from "~/hooks/useVueUse";
import { type LiuTimeout } from "~/utils/basic/type-tool";
import valTool from "~/utils/basic/val-tool";

export function useLpMain(
  props: LpmProps,
  emit: LpmEmit,
) {

  const lpSelectsEl = ref<HTMLElement>()
  const lpEmailInput = ref<HTMLInputElement>()
  const lpmData = reactive<LpmData>({
    current: 1,
    showEmailSubmit: false,
    emailVal: "",
    indicatorData: {
      width: "0px",
      left: "0px",
    }
  })

  const onTapSelect = (newIndex: number) => {
    if(lpmData.current === newIndex) return
    lpmData.current = newIndex
  }

  const calculateIndicator = () => {
    const parentEl = lpSelectsEl.value
    if(!parentEl) return
    const newIndex = lpmData.current
    const q = `.lps-item-${newIndex}`
    const childEl = parentEl.querySelector(q)
    if(!childEl) return
    const info = liuUtil.getIndicatorLeftAndWidth(parentEl, childEl)
    if(!info) return
    lpmData.indicatorData = info
  }

  watch(() => lpmData.current, (newV) => {
    calculateIndicator()
  })
  onMounted(async () => {
    calculateIndicator()
    await valTool.waitMilli(500)
    calculateIndicator()
  })

  let widthTimeout: LiuTimeout
  const { width } = useWindowSize()
  watch(width, (newV) => {
    if(widthTimeout) clearTimeout(widthTimeout)
    widthTimeout = setTimeout(() => {
      widthTimeout = undefined
      calculateIndicator()
    }, 200)
  })

  // 监听输入是否符合
  watch(() => lpmData.emailVal, (newV) => {
    checkEmailInput(lpmData)
  })

  const onEmailEnter = () => {
    if(props.isSendingEmail) return
    if(!lpmData.showEmailSubmit) return
    const email = lpmData.emailVal.trim().toLowerCase()
    emit("submitemail", email)

    const el = lpEmailInput.value
    if(!el) return
    el.blur()
  }

  
  return {
    lpSelectsEl,
    lpEmailInput,
    lpmData,
    onTapSelect,
    onEmailEnter,
  }
}

function checkEmailInput(
  lpmData: LpmData,
) {
  const oldSubmit = lpmData.showEmailSubmit
  const emailVal = lpmData.emailVal
  const val = emailVal.trim()
  
  const newSubmit = liuUtil.check.isEmail(val)
  if(oldSubmit !== newSubmit) {
    lpmData.showEmailSubmit = newSubmit
  }
}