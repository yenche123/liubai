// Function Name: common-i18n

import { 
  supportedLocales,
  type SupportedLocale,
  type Table_User,
} from "@/common-types"

export type LangAtom = Record<SupportedLocale, Record<string, string>>
export interface GetLangValOpt {
  locale?: SupportedLocale
  body?: any
  user?: Table_User
  lang?: string
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
    "image": "图片",
    "file": "文件",
    "other": "其它",
  },
  "zh-Hant": {
    "appName": "留白記事",
    "image": "圖片",
    "file": "文件",
    "other": "其它",
  },
  "en": {
    "appName": "Liubai",
    "image": "Image",
    "file": "File",
    "other": "Other",
  }
}

export const dateLang: LangAtom = {
  "zh-Hans": {
    "m_01": "一月",
    "m_02": "二月",
    "m_03": "三月",
    "m_04": "四月",
    "m_05": "五月",
    "m_06": "六月",
    "m_07": "七月",
    "m_08": "八月",
    "m_09": "九月",
    "m_10": "十月",
    "m_11": "11月",
    "m_12": "12月",
    "day_0": "日",
    "day_1": "一",
    "day_2": "二",
    "day_3": "三",
    "day_4": "四",
    "day_5": "五",
    "day_6": "六",
    "show_1": "{mm}/{dd} ({day}) {hr}:{min}",
    "show_2": "{mm}月{dd}日 {hr}:{min}",
    "show_3": "{yyyy}年{mm}月{dd}日 {hr}:{min}"
  },
  "zh-Hant": {
    "m_01": "一月",
    "m_02": "二月",
    "m_03": "三月",
    "m_04": "四月",
    "m_05": "五月",
    "m_06": "六月",
    "m_07": "七月",
    "m_08": "八月",
    "m_09": "九月",
    "m_10": "十月",
    "m_11": "11月",
    "m_12": "12月",
    "day_0": "日",
    "day_1": "一",
    "day_2": "二",
    "day_3": "三",
    "day_4": "四",
    "day_5": "五",
    "day_6": "六",
    "show_1": "{mm}/{dd} ({day}) {hr}:{min}",
    "show_2": "{mm}月{dd}日 {hr}:{min}",
    "show_3": "{yyyy}年{mm}月{dd}日 {hr}:{min}"
  },
  "en": {
    "m_01": "Jan",
    "m_02": "Feb",
    "m_03": "Mar",
    "m_04": "Apr",
    "m_05": "May",
    "m_06": "Jun",
    "m_07": "Jul",
    "m_08": "Aug",
    "m_09": "Sep",
    "m_10": "Oct",
    "m_11": "Nov",
    "m_12": "Dec",
    "day_0": "Su",
    "day_1": "Mo",
    "day_2": "Tu",
    "day_3": "We",
    "day_4": "Th",
    "day_5": "Fr",
    "day_6": "Sa",
    "show_1": "{mm} {dd} ({day}), {hr}:{min}",
    "show_2": "{mm}-{dd} {hr}:{min}",
    "show_3": "{yyyy}-{mm}-{dd} {hr}:{min}"
  }
}

export const userLoginLang: LangAtom = {
  "zh-Hans": {
    "confirmation_subject": "确认信",
    "confirmation_text_1": "你正在登录{appName}，以下是你的验证码:\n\n{code}",
    "confirmation_text_2": "\n\n该验证码 15 分钟内有效。",
    "login_success": "【登录提醒】",
    "login_way": "登录方式: {way}",
    "wechat_scan": "微信扫码",
    "operate_time": "操作时间: {time}",
    "ip_address": "IP 地址: {ip}",
    "device_info": "设备特征: {device}",
    "wechat_client": "微信客户端",
    "wecom_client": "企业微信",
    "dingtalk_client": "钉钉客户端",
    "alipay_client": "支付宝客户端",
    "feishu_client": "飞书客户端",
    "huawei_browser": "华为浏览器",
    "harmony_os": "鸿蒙",
    "android": "安卓",
    "quark_client": "夸克浏览器",
    "uc_client": "UC浏览器",
    "_unknown": "未知",
  },
  "zh-Hant": {
    "confirmation_subject": "確認信",
    "confirmation_text_1": "你正在登入{appName}，以下是你的驗證代號:\n\n{code}",
    "confirmation_text_2": "\n\n該驗證代號 15 分鐘內有效。",
    "login_success": "【登入提醒】",
    "login_way": "登入方式: {way}",
    "wechat_scan": "微信掃描",
    "operate_time": "操作時間: {time}",
    "ip_address": "IP 地址: {ip}",
    "device_info": "設備特徵: {device}",
    "wechat_client": "微信客戶端",
    "wecom_client": "企業微信",
    "dingtalk_client": "釘釘客戶端",
    "alipay_client": "支付寶客户端",
    "feishu_client": "飛書客户端",
    "huawei_browser": "華為瀏覽器",
    "harmony_os": "Harmony",
    "android": "Android",
    "quark_client": "夸克瀏覽器",
    "uc_client": "UC Browser",
    "_unknown": "未知",
  },
  "en": {
    "confirmation_subject": "Confirmation",
    "confirmation_text_1": "You are logging into {appName}. The following is your Vertification Code:\n\n{code}",
    "confirmation_text_2": "\n\nIt is valid within 15 minutes.",
    "login_success": "【Login Reminder】",
    "login_way": "Login Way: {way}",
    "wechat_scan": "WeChat Scan",
    "operate_time": "Operate Time: {time}",
    "ip_address": "IP Address: {ip}",
    "device_info": "Device Info: {device}",
    "wechat_client": "WeChat",
    "wecom_client": "WeCom",
    "dingtalk_client": "DingTalk",
    "alipay_client": "Alipay",
    "feishu_client": "Feishu",
    "huawei_browser": "Huawei Browser",
    "harmony_os": "Harmony",
    "android": "Android",
    "quark_client": "Quark Browser",
    "uc_client": "UC Browser",
    "_unknown": "Unknown",
  }
}

export const wecomLang: LangAtom = {
  "zh-Hans": {
    "welcome_1": "Hi! 我是留小白，你已成功绑定账号 {account}\n在你的留白记事中，若存在需要提醒的卡片，我将在第一时间通知你！",
    "welcome_2": "你好🥂，我是留小白！你的微信记录助手！我可以把你传给我的消息同步到留白记事上哦～\n\n请点击下方链接，完成帐号绑定。\n\n{link}",
    "welcome_3": "你好，我是留小白！你的微信消息捕捉助手！\n\n我注意到你扫描的二维码似乎已过期或失效，请点击下方链接，重新绑定帐号。\n\n{link}",
    "err_1": "绑定失败，该微信号已与其他留白记事帐号完成关联。请在原留白记事帐号上解除绑定后，再重新扫码。",
  },
  "zh-Hant": {
    "welcome_1": "Hi! 我是留小白，你已成功綁定帳號 {account}\n在你的留白記事中，若存在需要提醒的卡片，我將在第一時間通知你！",
    "welcome_2": "你好🥂，我是留小白！你的微信記錄助理！我可以把你傳給我的訊息同步到留白記事上哦～\n\n請點擊下方連結，完成帳號綁定。\n\n{link}",
    "welcome_3": "你好，我是留小白！你的微信訊息捕捉助理！\n\n我注意到你掃描的 QR Code 似乎已過期或失效，请點擊下方連結，重新綁定帳號。\n\n{link}",
    "err_1": "綁定失敗，該微信號已與其他留白記事帳號完成綁定。請在原留白記事帳號上解除綁定後，再重新掃描 QR Code",
  },
  "en": {
    "welcome_1": "Hi! I am Tiny Liu! You have successfully bound your account {account}\nIf you have any card you want to remind, I will notify you in the first time!",
    "welcome_2": "Hi🥂 I am Tiny Liu! Your Wechat Record Assistant! My duty is synchronising your message to your Liubai.\n\nNow, let's click the following link to bind your account. \n\n{link}",
    "welcome_3": "Hi, I am Tiny Liu! Your Wechat Message Capture Assistant!\n\nI notice that your QR code has expired or is invalid. Please click the following link to rebind your account.\n\n{link}",
    "err_1": "Binding failed. This Wechat number has already been bound to another account. Please unbind it from the original account first, then re-scan the QR code.",
  }
}

// Notes Calendar Task Todo
export const wechatLang: LangAtom = {
  "zh-Hans": {
    "welcome_1": "欢迎关注留白记事！\n\n留白记事 = 备忘录📝 + 日历📆 + 任务📌 + 待办清单📂\n\n你可以在这里记录所有事情，所有“只属于你”的信息都将在这里汇聚。\n\n若这世界就是一个巨大的游乐园，请去体验，去创造🥂\n\n[未完待续]",
    "already_bound": "当前微信已绑定帐号 {account}\n请先在原帐号上解绑后，再重新扫码。",
    "success_1": "绑定成功🎉",
  },
  "zh-Hant": {
    "welcome_1": "歡迎追蹤留白記事！\n\n留白記事 = 備忘錄📝 + 行事曆📆 + 任務📌 + 待辦清單📂\n\n你可以在這裡記錄所有事情，所有「只屬於你」的資訊都將在這裡匯聚。\n\n若這世界就是一個巨大的遊樂園，請去體驗、去創造🥂\n\n[未完待續]",
    "already_bound": "當前微信已綁定帳號 {account}\n請先在原帳號上解綁後，再重新掃描 QR Code",
    "success_1": "綁定成功🎉",
  },
  "en": {
    "welcome_1": "Welcome to follow Liubai!\n\nLiubai = Notes📝 + Calendar📆 + Tasks📌 + Todo📂\n\nYou can record all your life’s events, and all information you want is out here.\n\nIf this world is a giant playground, please experience it and create it 🥂\n\n[To be continued]",
    "already_bound": "Current Wechat has already bound account {account}\nPlease unbind it from the original account first, then re-scan the QR code.",
    "success_1": "Binding successful🎉",
  }
}

export const wechatMenuClickLang: LangAtom = {
  "zh-Hans": {

  },
  "zh-Hant": {

  },
  "en": {

  }
}



/********************* 映射函数 ****************/

/** 获取兜底语言 */
let fallbackLocale: SupportedLocale | undefined
export function getFallbackLocale(): SupportedLocale {
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
  if(val.startsWith("zh")) return "zh-Hans"
  if(val.length > 1) return "en"

  return getFallbackLocale()
}

/** 获取当前注入信息下的语言 */
export function getCurrentLocale(
  opt?: GetLangValOpt
): SupportedLocale {
  let locale = opt?.locale
  if(locale) return locale

  // 从 lang 判断
  const lang = opt?.lang
  if(lang && lang !== "system") {
    locale = normalizeLanguage(lang)
    return locale
  }
  
  // 从 user 中判断
  const user = opt?.user
  if(user) {
    const { language, systemLanguage } = user
    if(language !== "system") return language
    if(systemLanguage) {
      locale = normalizeLanguage(systemLanguage)
    }
    else {
      locale = getFallbackLocale()
    }
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

export type T_I18N = (key: string, opt2?: Record<string, string>) => string


/** 返回一个翻译函数 t */
export function useI18n(
  langAtom: LangAtom,
  opt1?: GetLangValOpt,
) {

  const _getVal = (key: string) => {
    const locale = getCurrentLocale(opt1)
    let val = langAtom[locale]?.[key]
    if(val) return val
    const fLocale = getFallbackLocale()
    if(fLocale !== locale) {
      val = langAtom[fLocale]?.[key]
      if(val) return val
    }
  }

  const t: T_I18N = (key: string, opt2?: Record<string, string>) => {
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