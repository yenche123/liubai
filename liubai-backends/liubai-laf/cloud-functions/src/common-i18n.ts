import type {
  SupportedLocale,
  Table_User,
} from "@/common-types"
import { supportedLocales } from "@/common-types"

export type LangAtom = Record<SupportedLocale, Record<string, string>>
export interface GetLangValOpt {
  locale?: SupportedLocale
  body?: any
  user?: Table_User
}

/********************* 空函数 ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing")
  return true
}


/********************* 映射函数 ****************/

/** 获取兜底语言 */
let fallbackLocale: SupportedLocale | undefined
function getFallbackLocale(): SupportedLocale {
  if(fallbackLocale) return fallbackLocale
  const f = process.env.LIU_FALLBACK_LOCALE
  if(!f) return "en"
  const existed = supportedLocales.includes(f as SupportedLocale)
  if(!existed) return "en"
  fallbackLocale = f as SupportedLocale
  return fallbackLocale
}

/** 归一化语言 */
function normalizeLanguage(val: string): SupportedLocale {
  val = val.toLowerCase()
  if(!val) return getFallbackLocale()

  val = val.replace(/_/g, "-")

  if(val === "zh-hant") return "zh-Hant"
  if(val === "zh-tw") return "zh-Hant"
  if(val === "zh-hk") return "zh-Hant"
  if(val === "zh-cn") return "zh-Hans"
  if(val === "zh-hans") return "zh-Hans"
  if(val.startsWith("zh")) return "zh-Hans"

  return getFallbackLocale()
}

/** 获取当前注入信息下的语言 */
function getCurrentLocale(
  opt?: GetLangValOpt
): SupportedLocale {
  let locale = opt?.locale
  if(locale) return locale
  
  // 从 user 中判断
  const user = opt?.user
  if(user) {
    const { language, systemLanguage = "en" } = user
    if(language !== "system") return language
    locale = normalizeLanguage(systemLanguage)
    return locale
  }

  // 从 body 中判断
  const liuLang = opt?.body?.x_liu_language
  if(liuLang && typeof liuLang === "string") {
    locale = normalizeLanguage(liuLang)
    return locale
  }

  return getFallbackLocale()
}


// 获取某个 i18n 所对应的值
export function getLangVal(
  langAtom: LangAtom,
  key: string,
  opt?: GetLangValOpt,
) {
  let locale = getCurrentLocale(opt)
  let val = langAtom[locale]?.[key]
  if(val) return val

  const fLocale = getFallbackLocale()
  if(fLocale !== locale) {
    val = langAtom[fLocale]?.[key]
    if(val) return val
  }

  return ""
}

/********************* 各单元 ****************/
export const userLoginLang: LangAtom = {
  "zh-Hans": {
    "st": "asd"
  },
  "zh-Hant": {

  },
  "en": {

  }
}