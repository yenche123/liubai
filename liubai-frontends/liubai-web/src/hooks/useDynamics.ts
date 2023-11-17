// 返回全局动态参数，比如语言 (language) / 主题 (theme)

import { ref } from "vue"
import type { Ref } from "vue"
import type { SupportedTheme } from "../types/types-atom"
import type { SupportedLocale } from "../types/types-locale"
import { i18n } from "~/locales"
import localCache from "../utils/system/local-cache"
import liuApi from "~/utils/liu-api"
import middleBridge from "~/utils/middle-bridge"

const theme = ref<SupportedTheme | "">("")

export function useDynamics() {
  const language = i18n.global.locale

  const setLanguage = (val: SupportedLocale) => {
    language.value = val
    middleBridge.setAppTitle()
  }

  const setTheme = (val: SupportedTheme) => {
    theme.value = val
    setClassForTheme()
  }

  return { 
    language, 
    setLanguage, 
    theme: theme as Ref<SupportedTheme>,
    setTheme,
  }
}

export type UseDynamicsType = ReturnType<typeof useDynamics>


// 初始化主题
export function initTheme() {
  if(theme.value) return
  const localPf = localCache.getPreference()
  const _theme = localPf.theme
  if(!_theme || _theme === "system") {
    theme.value = liuApi.getThemeFromSystem()
  }
  else if(_theme === "auto") {
    theme.value = liuApi.getThemeFromTime()
  }
  else theme.value = _theme

  // 有必要的话为 body 添加 .theme-dark
  const body = document.querySelector("body")
  if(theme.value === "dark") body?.classList.add("theme-dark")
}

// classList 的用法，见
// https://teagan-hsu.coderbridge.io/2020/12/29/how-to-set-css-styles-using-javascript/
function setClassForTheme() {
  const t = theme.value
  const body = document.querySelector("body")
  const val = t === "light" ? false : true
  body?.classList.toggle("theme-dark", val)

  // 在 document 的根目录上: 当深色模式时，添加 .liu-dark，否则移除 .liu-dark
  document.documentElement.classList.toggle("liu-dark", val)
}
