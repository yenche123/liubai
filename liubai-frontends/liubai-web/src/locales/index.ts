import { createI18n } from 'vue-i18n'
import en from "./messages/en.json"
import zhHans from "./messages/zh-Hans.json"
import zhHant from "./messages/zh-Hant.json"
import type { SupportedLocale } from "../types/types-locale"
import { isSupportedLocale } from '../types/types-locale'
import localCache from '../utils/system/local-cache'

// 初始化语言
const initLocale = (): SupportedLocale => {
  // 从缓存里取
  const localPf = localCache.getLocalPreference()
  const lang0 = localPf.language
  // return "en"
  if(lang0 && isSupportedLocale(lang0)) return lang0

  // 从浏览器的 navigator 里取
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


export const i18n = createI18n({
  locale: initLocale(),
  messages: {
    "en": en,
    "zh-Hans": zhHans,
    "zh-Hant": zhHant
  },
  legacy: false
})

export type LiuI18n = typeof i18n