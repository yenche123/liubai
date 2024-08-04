import type { SupportedTheme } from "~/types/types-atom"
import type { SupportedLocale } from "~/types/types-locale"
import { isSupportedLocale } from '~/types/types-locale'
import time from "../basic/time"

type ResolveReject = (res: boolean | undefined) => void
export interface BatteryManager extends EventTarget {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
}

const copyToClipboard = (text: string) => {

  // 方法2: 使用 navigator.clipboard
  let _fun2 = async (a: ResolveReject, b: ResolveReject, text: string) => {
    let res = false
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      res = true
    }

    a(res)
  }

  // 方法1: 创建 textarea 复制
  let _fun1 = (a: ResolveReject, b: ResolveReject, text: string) => {
    const element = document.createElement('textarea')
    document.body.appendChild(element)
    element.value = text
    element.select()
    if (document.execCommand('copy')) {
      document.body.removeChild(element)
      a(true)
      return
    }
    document.body.removeChild(element)
    _fun2(a, b, text)
  }

  // 判断使用哪个方法
  let _t = (a: ResolveReject, b: ResolveReject) => {
    if (!text) {
      console.warn(`没有内容要剪贴.....`)
      a(false)
      return
    }

    if (text.length > 500) {
      _fun2(a, b, text)
    }
    else {
      _fun1(a, b, text)
    }
  }

  return new Promise(_t)
}

const vibrate = (pattern: VibratePattern) => {
  if(!navigator || !('vibrate' in navigator)) {
    return false
  }

  let res: Boolean
  try {
    res = navigator.vibrate(pattern)
  }
  catch(err) {
    console.log("vibrate err: ")
    console.log(err)
    return false
  }
  return res
}

const getBattery = async () => {
  if(!navigator || !('getBattery' in navigator)) {
    return false
  }

  //@ts-ignore
  const res = await navigator.getBattery() as BatteryManager
  return res
}

// 从浏览器获取当前主题
function getThemeFromSystem(): SupportedTheme {
  const m = window.matchMedia('(prefers-color-scheme: dark)')
  const isDarkWhenInit = m.matches
  if(isDarkWhenInit) return "dark"
  return "light"
}

// 从当前时间判断要显示哪个主题
// 目前规则: 6:00 ~ 17:59 显示浅色模式，否则显示深色模式
function getThemeFromTime(): SupportedTheme {
  const now = time.getTime()
  const date = new Date(now)
  const hr = date.getHours()
  if(hr >= 6 && hr <= 17) return "light"
  return "dark"
}

export function isPrefersReducedMotion() {
  const res = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches
  return res
}

// 从浏览器获取当前支持的语言
function getLanguageFromSystem(): SupportedLocale {
  const lang = navigator.language
  if(isSupportedLocale(lang)) return lang

  const langs = navigator.languages
  for(let i=0; i<langs.length; i++) {
    let aLang = langs[i]
    if(isSupportedLocale(aLang)) return aLang
    const _aLang = aLang.toLowerCase()
    if(_aLang === "zh-tw") return "zh-Hant"
    if(_aLang === "zh-hk") return "zh-Hant"
    if(_aLang === "zh-cn") return "zh-Hans"
    if(_aLang === "en-us") return "en"
  }

  // 判断 langs 是否有 zh
  if(langs.includes("zh")) return "zh-Hans"

  return "en"
}

// Badge API 设置小红点（当 web app 已被安装时才会生效）
// w3c: https://www.w3.org/TR/badging/
const setAppBadge = async (val?: number) => {
  const supported = "setAppBadge" in navigator
  if(!supported) return false

  //@ts-ignore
  const res = await navigator.setAppBadge(val)
  return res
}

// 清除小红点，clearAppBadge() 等效于 setAppBadge(0)
const clearAppBadge = async () => {
  const supported = "clearAppBadge" in navigator
  if(!supported) return false

  //@ts-ignore
  const res = await navigator.clearAppBadge()
  return res
}


export default {
  copyToClipboard,
  vibrate,
  getBattery,
  getThemeFromSystem,
  getThemeFromTime,
  isPrefersReducedMotion,
  getLanguageFromSystem,
  setAppBadge,
  clearAppBadge,
}