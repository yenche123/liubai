// handle with language and theme
import { defineStore } from "pinia";
import { type Ref, ref } from "vue";
import type {
  SupportedTheme, 
  LocalTheme,
  LocalFontSize,
} from "~/types/types-atom";
import type { LocalLocale, SupportedLocale } from "~/types/types-locale";
import liuApi from "~/utils/liu-api";
import localCache from "~/utils/system/local-cache";
import { i18n } from "~/locales";
import middleBridge from "~/utils/middle-bridge";
import cfg from "~/config";

export const useSystemStore = defineStore("system", () => {

  const local_theme = ref<LocalTheme>("system")
  const supported_theme = ref<SupportedTheme>("light")

  const local_lang = ref<LocalLocale>("system")
  const supported_lang = i18n.global.locale

  const local_font_size = ref<LocalFontSize>("L")
  
  initTheme(local_theme, supported_theme)
  initLang(local_lang)
  initFontSize(local_font_size)

  const setTheme = (theme: LocalTheme = "system") => {
    if(theme === local_theme.value) return
    localCache.setPreference("theme", theme)
    local_theme.value = theme
    toSetSupportedTheme(theme, supported_theme)
    setClassForTheme(supported_theme)
  }

  const setLanguage = (lang: LocalLocale = "system") => {
    if(lang === local_lang.value) return
    localCache.setPreference("language", lang)
    local_lang.value = lang
    toSetSupportedLang(lang, supported_lang)
    middleBridge.setAppTitle()
  }

  const setFontSize = (size: LocalFontSize = "L") => {
    if(size === local_font_size.value) return
    localCache.setOnceData("fontSize", size)
    local_font_size.value = size
    setClassForFontSize(local_font_size)
  }

  const checkTheme = () => {
    toCheckTheme(local_theme, supported_theme)
  }


  return {
    local_theme,
    supported_theme,
    local_lang,
    supported_lang,
    local_font_size,
    setTheme,
    setLanguage,
    setFontSize,
    checkTheme,
  }

})

export type UseSystemType = ReturnType<typeof useSystemStore>

function toCheckTheme(
  local_theme: Ref<LocalTheme>,
  supported_theme: Ref<SupportedTheme>,
) {
  const localPf = localCache.getPreference()
  const _theme = localPf.theme

  let newLocal: LocalTheme
  let newSupported: SupportedTheme

  if(!_theme || _theme === "system") {
    newLocal = "system"
    newSupported = liuApi.getThemeFromSystem()
  }
  else if(_theme === "auto") {
    newLocal = "auto"
    newSupported = liuApi.getThemeFromTime()
  }
  else {
    newLocal = _theme
    newSupported = _theme
  }

  if(local_theme.value !== newLocal) {
    local_theme.value = newLocal
  }
  if(supported_theme.value !== newSupported) {
    supported_theme.value = newSupported
    setClassForTheme(supported_theme)
  }
}

function toSetSupportedTheme(
  theme: LocalTheme,
  supported_theme: Ref<SupportedTheme>,
) {
  if(theme === "system") {
    supported_theme.value = liuApi.getThemeFromSystem()
  }
  else if(theme === "auto") {
    supported_theme.value = liuApi.getThemeFromTime()
  }
  else {
    supported_theme.value = theme
  }
}

// classList 的用法，见
// https://teagan-hsu.coderbridge.io/2020/12/29/how-to-set-css-styles-using-javascript/
function setClassForTheme(
  supported_theme: Ref<SupportedTheme>,
) {

  // 1. toggle .theme-dark on body
  const t = supported_theme.value
  const body = document.querySelector("body")
  const val = t === "dark" ? true : false
  body?.classList.toggle("theme-dark", val)

  // 2. 在 document 的根目录上: 当深色模式时，添加 .liu-dark，否则移除 .liu-dark
  document.documentElement.classList.toggle("liu-dark", val)

  // 3. change meta name="theme-color"
  const color = cfg.title_bar_colors[t]
  const theme_color = document.querySelector(`head > meta[name="theme-color"]`)
  theme_color?.setAttribute("content", color)
}

function setClassForFontSize(
  local_font_size: Ref<LocalFontSize>,
) {
  const val = local_font_size.value
  const body = document.querySelector("body")
  const isMedium = val === "M"
  body?.classList.toggle("liu-font-medium", isMedium)
}

function toSetSupportedLang(
  lang: LocalLocale,
  supported_lang: Ref<SupportedLocale>,
) {
  if(lang === "system") {
    supported_lang.value = liuApi.getLanguageFromSystem()
  }
  else {
    supported_lang.value = lang
  }
}


function initTheme(
  local_theme: Ref<LocalTheme>,
  supported_theme: Ref<SupportedTheme>,
) {
  const localPf = localCache.getPreference()
  const _theme = localPf.theme

  if(!_theme || _theme === "system") {
    local_theme.value = "system"
    supported_theme.value = liuApi.getThemeFromSystem()
  }
  else if(_theme === "auto") {
    local_theme.value = "auto"
    supported_theme.value = liuApi.getThemeFromTime()
  }
  else {
    local_theme.value = _theme
    supported_theme.value = _theme
  }

  setClassForTheme(supported_theme)
}


function initLang(
  local_lang: Ref<LocalLocale>,
) {
  const { language } = localCache.getPreference()
  if(!language) {
    local_lang.value = "system"
  }
  else {
    local_lang.value = language
  }
}

function initFontSize(
  local_font_size: Ref<LocalFontSize>,
) {
  const { fontSize = "L" } = localCache.getOnceData()
  if(fontSize !== local_font_size.value) {
    local_font_size.value = fontSize
  }

  if(fontSize !== "L") {
    setClassForFontSize(local_font_size)
  }
}