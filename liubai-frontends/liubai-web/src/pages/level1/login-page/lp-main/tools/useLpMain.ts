import { onMounted, reactive, ref, watch } from "vue";
import type { LpmProps, LpmData, LpmEmit } from "./types"
import liuUtil from '~/utils/liu-util';
import { useDebounceFn, useWindowSize } from "~/hooks/useVueUse";
import valTool from "~/utils/basic/val-tool";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { storeToRefs } from "pinia";
import liuEnv from "~/utils/liu-env";

export function useLpMain(
  props: LpmProps,
  emit: LpmEmit,
) {
  const _env = liuEnv.getEnv()
  const loginWays = _env.LOGIN_WAYS ?? []

  const lpSelectsEl = ref<HTMLElement>()
  const lpEmailInput = ref<HTMLInputElement>()
  const lpmData = reactive<LpmData>({
    current: 1,
    showEmailSubmit: false,
    showPhoneSubmit: false,
    emailVal: "",
    phoneVal: "",
    smsVal: "",
    indicatorData: {
      width: "0px",
      left: "0px",
    },
    loginViaWeChat: loginWays.includes("wechat"),
    loginViaGoogle: loginWays.includes("google"),
    loginViaGitHub: loginWays.includes("github"),
    btnOne: loginWays.includes("phone") ? "phone" : "email",
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

  const _doubleCheck = async (ms: number = 500) => {
    calculateIndicator()
    await valTool.waitMilli(ms)
    calculateIndicator()
  }

  onMounted(_doubleCheck)
  const gStore = useGlobalStateStore()
  const { windowLoaded } = storeToRefs(gStore)
  watch(windowLoaded, () => _doubleCheck(900))

  const _debounce = useDebounceFn(() => {
    calculateIndicator()
  }, 200)
  const { width } = useWindowSize()
  watch(width, _debounce)

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

  const onPhoneEnter = () => {

  }

  const onTapGettingSMSCode = () => {

  }

  const onSmsEnter = () => {

  }

  const onTapFinishForSMS = () => {

  }
  
  return {
    lpSelectsEl,
    lpEmailInput,
    lpmData,
    onTapSelect,
    onEmailEnter,
    onPhoneEnter,
    onSmsEnter,
    onTapGettingSMSCode,
    onTapFinishForSMS,
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