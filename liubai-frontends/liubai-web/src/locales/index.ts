import { createI18n } from 'vue-i18n'
import en from "./messages/en.json"
import zhHans from "./messages/zh-Hans.json"
import zhHant from "./messages/zh-Hant.json"
import type { SupportedLocale } from "../types/types-locale"
import { isSupportedLocale } from '../types/types-locale'
import localCache from '../utils/system/local-cache'
import liuApi from '~/utils/liu-api'
import liuEnv from '~/utils/liu-env'
import {
  registerMessageResolver, // register the message resolver API
  resolveValue, // message resolver of vue-i18n which is used by default
} from '@intlify/core-base'

registerMessageResolver(resolveValue)

// 初始化语言
const initLocale = (): SupportedLocale => {
  // 从缓存里取
  const localPf = localCache.getPreference()
  const lang0 = localPf.language
  // return "en"
  if(lang0 && isSupportedLocale(lang0)) return lang0

  // 从浏览器的 navigator 里取
  return liuApi.getLanguageFromSystem()
}

const getFallbackLocale = (): SupportedLocale => {
  const env = liuEnv.getEnv()
  return env.FALLBACK_LOCALE as SupportedLocale
}

export const i18n = createI18n({
  locale: initLocale(),
  fallbackLocale: getFallbackLocale(),
  messages: {
    "en": en,
    "zh-Hans": zhHans,
    "zh-Hant": zhHant
  },
  legacy: false
})

export type LiuI18n = typeof i18n
export type T_i18n = typeof i18n.global.t