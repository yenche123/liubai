import { nextTick, onMounted, reactive, ref, toRef, watch } from "vue";
import type { LpmProps, LpmData, LpmEmit } from "./types"
import liuUtil from '~/utils/liu-util';
import { useDebounceFn, useWindowSize } from "~/hooks/useVueUse";
import valTool from "~/utils/basic/val-tool";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { storeToRefs } from "pinia";
import liuEnv from "~/utils/liu-env";
import cui from "~/components/custom-ui"
import type { LoginByThirdParty } from "../../tools/types";

export function useLpMain(
  props: LpmProps,
  emit: LpmEmit,
) {
  const _env = liuEnv.getEnv()
  const loginWays = _env.LOGIN_WAYS ?? []

  const lpSelectsEl = ref<HTMLElement>()
  const lpEmailInput = ref<HTMLInputElement>()
  const lpPhoneInput = ref<HTMLInputElement>()
  const lpSmsInput = ref<HTMLInputElement>()
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
    wechatEnabled: loginWays.includes("wechat"),
    googleEnabled: loginWays.includes("google"),
    githubEnabled: loginWays.includes("github"),
    btnOne: loginWays.includes("phone") ? "phone" : "email",
    smsStatus: "can_tap",
    agreeRule: false,
    agreeShakingNum: 0,
    emailEnabled: loginWays.includes("email"),
    phoneEnabled: loginWays.includes("phone"),
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
  watch(() => lpmData.emailVal, () => checkEmailInput(lpmData))
  watch(() => lpmData.phoneVal, () => checkPhoneAndSmsCodeInput(lpmData))
  watch(() => lpmData.smsVal, () => checkPhoneAndSmsCodeInput(lpmData))

  const _makeElBlur = (el: HTMLInputElement | undefined) => {
    if(!el) return
    el.blur()
  }

  const onEmailEnter = () => {
    if(props.isSendingEmail) return
    if(!lpmData.showEmailSubmit) return
    if(!lpmData.agreeRule) {
      lpmData.agreeShakingNum++
      return
    }
    const email = lpmData.emailVal.trim().toLowerCase()
    emit("submitemail", email)
    _makeElBlur(lpEmailInput.value)
  }

  const _toRequestSMSCode = (phone: string) => {
    if(props.isLoggingByPhone || props.isSendingEmail) {
      return false
    }
    if(!lpmData.agreeRule) {
      lpmData.agreeShakingNum++
      return false
    }
    emit("requestsmscode", phone)
    lpmData.smsStatus = "loading"
    return true
  }

  const onPhoneEnter = () => {
    const val = lpmData.phoneVal.trim()
    const res1 = liuUtil.check.isAllNumber(val, 11)
    if(!res1) return
    if(lpmData.smsStatus !== "can_tap") return
    const res2 = _toRequestSMSCode(`86_${val}`)
    if(!res2) return
    _makeElBlur(lpPhoneInput.value)
    lpSmsInput.value?.focus()
  }

  const onTapGettingSMSCode = () => {
    // 1. checking out phone number
    const val = lpmData.phoneVal.trim()
    const res1 = liuUtil.check.isAllNumber(val, 11)
    if(!res1) {
      cui.showModal({
        title: "🫣",
        content_key: "login.err_10",
        isTitleEqualToEmoji: true,
        showCancel: false,
      })
      return
    }

    // 2. to request
    _toRequestSMSCode(`86_${val}`)
  }

  const onSmsEnter = () => {
    checkPhoneAndSmsCodeInput(lpmData)
    if(!lpmData.showPhoneSubmit) return
    if(props.isLoggingByPhone || props.isSendingEmail) return
    if(!lpmData.agreeRule) {
      lpmData.agreeShakingNum++
      return
    }
    const phone = `86_` + lpmData.phoneVal.trim()
    const smsCode = lpmData.smsVal.trim()
    emit("submitsmscode", phone, smsCode)
    _makeElBlur(lpSmsInput.value)
  }

  const onTapFinishForSMS = () => {
    onSmsEnter()
  }

  // listen to smsSendingNum from login-page
  const smsSendingNum = toRef(props, "smsSendingNum")
  watch(smsSendingNum, (newV, oldV) => {
    if(newV > oldV) {
      lpmData.smsStatus = "counting"
    }
  })


  const onTapThirdParty = (thirdParty: LoginByThirdParty) => {
    if(!lpmData.agreeRule) {
      lpmData.agreeShakingNum++
      return
    }
    emit("tapthirdparty", thirdParty)
  }

  const onToggleEmailPhone = async () => {
    lpmData.btnOne = lpmData.btnOne === "phone" ? "email" : "phone"
    await nextTick()
    calculateIndicator()
  }

  
  return {
    lpSelectsEl,
    lpEmailInput,
    lpPhoneInput,
    lpSmsInput,
    lpmData,
    onTapSelect,
    onEmailEnter,
    onPhoneEnter,
    onSmsEnter,
    onTapGettingSMSCode,
    onTapFinishForSMS,
    onTapThirdParty,
    onToggleEmailPhone,
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

function checkPhoneAndSmsCodeInput(
  lpmData: LpmData,
) {
  const phoneVal = lpmData.phoneVal
  const val = phoneVal.trim()
  const res1 = liuUtil.check.isAllNumber(val, 11)
  if(!res1) {
    lpmData.showPhoneSubmit = false
    return
  }

  const smsVal = lpmData.smsVal
  const val2 = smsVal.trim()
  const res2 = liuUtil.check.isAllNumber(val2, 6)
  if(!res2) {
    lpmData.showPhoneSubmit = false
    return
  }

  lpmData.showPhoneSubmit = true
}