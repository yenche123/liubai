import { createI18n } from 'vue-i18n'
import en from "./messages/en.json"
import zhHans from "./messages/zh-Hans.json"
import zhHant from "./messages/zh-Hant.json"
import type { SupportedLocale } from "../types/types-locale"
import { isSupportedLocale } from '../types/types-locale'

const initLocale = (): SupportedLocale => {
  const lang = navigator.language
  if(isSupportedLocale(lang)) return lang

  const langs = navigator.languages
  for(let i=0; i<langs.length; i++) {
    let aLang = langs[i]
    if(isSupportedLocale(aLang)) return aLang
    if(aLang === "zh-TW") return "zh-Hant"
    if(aLang === "zh-HK") return "zh-Hant"
    if(aLang === "zh-CN") return "zh-Hans"
    if(aLang === "en-US") return "en"
  }

  return "en"
}


const i18n = createI18n({
  locale: initLocale(),
  messages: {
    "en": en,
    "zh-Hans": zhHans,
    "zh-Hant": zhHant
  },
  legacy: false
})

export {
  i18n
}