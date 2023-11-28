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

/********************* 各单元 ****************/

export const commonLang: LangAtom = {
  "zh-Hans": {
    "appName": "留白记事",
  },
  "zh-Hant": {
    "appName": "留白記事",
  },
  "en": {
    "appName": "Liubai"
  }
}

export const userLoginLang: LangAtom = {
  "zh-Hans": {
    "confirmation_subject": "确认信",
    "confirmation_text_1": "你正在登录{appName}，以下是你的验证码:\n\n{code}",
    "confirmation_text_2": "\n\n该验证码十分钟内有效。"
  },
  "zh-Hant": {
    "confirmation_subject": "確認信",
    "confirmation_text_1": "你正在登入{appName}，以下是你的驗證代號:\n\n{code}",
    "confirmation_text_2": "\n\n該驗證代號十分鐘內有效。"
  },
  "en": {
    "confirmation_subject": "Confirmation",
    "confirmation_text_1": "You are logging into {appName}. The following is your Vertification Code:\n\n{code}",
    "confirmation_text_2": "\n\nIt is valid within 10 minutes."
  }
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

/** 返回一个翻译函数 t */
export function useI18n(
  langAtom: LangAtom,
  opt1?: GetLangValOpt,
) {

  const _getVal = (key: string) => {
    let locale = getCurrentLocale(opt1)
    let val = langAtom[locale]?.[key]
    if(val) return val
    const fLocale = getFallbackLocale()
    if(fLocale !== locale) {
      val = langAtom[fLocale]?.[key]
      if(val) return val
    }
  }

  const t = (key: string, opt2?: Record<string, string>) => {
    let res = _getVal(key)
    if(!res) return ""
    if(!opt2) return res

    // 处理 opt2
    const keys = Object.keys(opt2)
    for(let i=0; i<keys.length; i++) {
      const v = keys[i]
      const theVal = opt2[v]
      const dynamicPattern = `{${v}}`
      const escapedPattern = dynamicPattern.replace(/[{}]/g, '\\$&')
      const regexPattern = new RegExp(escapedPattern, 'g')
      res = res.replace(regexPattern, theVal) 
    }
    return res
  }

  return { t }
}

/** 获取应用名称 */
export function getAppName(
  opt1?: GetLangValOpt,
) {
  const { t } = useI18n(commonLang, opt1)
  const res = t('appName')
  if(res) return res
  return "xxx"
}