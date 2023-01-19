// 返回全局动态参数，比如语言 (language) / 主题 (theme)

import { Ref, ref } from "vue"
import { useI18n } from "vue-i18n"
import type { SupportedTheme } from "../types"
import localCache from "../utils/system/local-cache"

const theme = ref<SupportedTheme | "">("")

export const useDynamics = () => {
  const i18n = useI18n()
  let language = i18n.locale

  initTheme()

  const setLanguage = (val: string) => {
    language.value = val
  }

  const setTheme = (val: SupportedTheme) => {
    theme.value = val
    setBodyClassForTheme()
  }

  return { 
    language, 
    setLanguage, 
    theme: theme as Ref<SupportedTheme>,
    setTheme,
  }
}

// 初始化主题
function initTheme() {
  if(theme.value) return
  const localPf = localCache.getLocalPreference()
  const _theme = localPf.theme
  if(!_theme || _theme === "system") {
    theme.value = getThemeFromSystem()
  }
  else theme.value = _theme

  // 有必要的话为 body 添加 .theme-dark
  const body = document.querySelector("body")
  if(theme.value === "dark") body?.classList.add("theme-dark")
}

// classList 的用法，见
// https://teagan-hsu.coderbridge.io/2020/12/29/how-to-set-css-styles-using-javascript/
function setBodyClassForTheme() {
  const t = theme.value
  const body = document.querySelector("body")
  const val = t === "light" ? false : true
  body?.classList.toggle("theme-dark", val)
}

// 从浏览器获取当前主题
function getThemeFromSystem(): SupportedTheme {
  const m = window.matchMedia('(prefers-color-scheme: dark)')
  const isDarkWhenInit: boolean = m.matches
  if(isDarkWhenInit) return "dark"
  return "light"
}
