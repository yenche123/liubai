// 返回全局动态参数，比如语言 (language) / 主题 (theme)

import { ref } from "vue"
import type { Ref } from "vue"
import type { SupportedTheme } from "../types"
import type { SupportedLocale } from "../types/types-locale"
import { i18n } from "~/locales"
import localCache from "../utils/system/local-cache"
import liuApi from "~/utils/liu-api"

const theme = ref<SupportedTheme | "">("")

export const useDynamics = () => {
  const language = i18n.global.locale

  initTheme()

  const setLanguage = (val: SupportedLocale) => {
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

export type UseDynamicsType = ReturnType<typeof useDynamics>


// 初始化主题
function initTheme() {
  if(theme.value) return
  const localPf = localCache.getLocalPreference()
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
function setBodyClassForTheme() {
  const t = theme.value
  const body = document.querySelector("body")
  const val = t === "light" ? false : true
  body?.classList.toggle("theme-dark", val)
}
