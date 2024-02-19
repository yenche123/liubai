// handle with language and theme
import { defineStore } from "pinia";
import { type Ref, ref } from "vue";
import type {
  SupportedTheme, 
  LocalTheme,
} from "~/types/types-atom";
import type { LocalLocale, SupportedLocale } from "~/types/types-locale";
import liuApi from "~/utils/liu-api";
import localCache from "~/utils/system/local-cache";
import { i18n } from "~/locales";

export const useSystemStore = defineStore("system", () => {

  const local_theme = ref<LocalTheme>("auto")
  const supported_theme = ref<SupportedTheme>("light")

  const local_lang = ref<LocalLocale>("system")
  const supported_lang = i18n.global.locale

  initTheme(local_theme, supported_theme)
  initLang(local_lang)

  const setTheme = (theme: LocalTheme) => {
    localCache.setPreference("theme", theme)
    local_theme.value = theme
    toSetSupportedTheme(theme, supported_theme)
  }

  const setLanguage = (lang: LocalLocale) => {
    localCache.setPreference("language", lang)
    local_lang.value = lang
    toSetSupportedLang(lang, supported_lang)
  }

  return {
    local_theme,
    supported_theme,
    local_lang,
    supported_lang,
    setTheme,
    setLanguage,
  }

})


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

  // add .theme-dark if nescessary
  if(supported_theme.value === "dark") {
    const body = document.querySelector("body")
    body?.classList.add("theme-dark")
  }

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