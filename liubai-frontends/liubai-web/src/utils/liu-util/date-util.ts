import { isEqual, isToday, isTomorrow, isYesterday } from 'date-fns'
import { i18n } from '../../locales'
import type { LiuRemindEarly, LiuRemindLater, LiuRemindMe } from '../../types/types-atom'
import { REMIND_LATER, REMIND_EARLY } from "../../config/atom"
import { SupportedLocale } from '../../types/types-locale'
import time from '../basic/time'
import valTool from '../basic/val-tool'
import type { ComposerTranslation } from "vue-i18n"

// 如果当前分钟数 < 30，获取下一个点的整点时间
// 否则获取下两个点的整点时间
export function getDefaultDate() {
  const d = new Date()
  const diffHr = d.getMinutes() < 30 ? 1 : 2
  d.setHours(d.getHours() + diffHr)
  d.setMinutes(0)
  d.setSeconds(0)
  d.setMilliseconds(0)
  return d
}

export function areTheDatesEqual(d1: Date, d2: Date) {
  return isEqual(d1, d2)
}

// 给定时间（戳），展示时间，用于 "什么时候" / "提醒我"
export function showBasicDate(val: Date | number, lang?: SupportedLocale) {
  let d = typeof val === "number" ? new Date(val) : val
  const curDate = time.getDate()
  const { t, locale } = i18n.global
  if(!lang) {
    lang = locale.value as SupportedLocale
  }

  const yy = d.getFullYear()
  const mm = valTool.format0(d.getMonth() + 1)
  const dd = valTool.format0(d.getDate())
  const hr = valTool.format0(d.getHours())
  const min = valTool.format0(d.getMinutes())
  const MON = t("date_related.m_" + mm)
  const DAY = t("date_related.day_" + d.getDay())

  if(isToday(d)) {
    return `${t("common.today")} ${hr}:${min}`
  }
  if(isYesterday(d)) {
    return `${t("common.yesterday")} ${hr}:${min}`
  }
  if(isTomorrow(d)) {
    return `${t("common.tomorrow")} ${hr}:${min}`
  }

  // 在今年
  if(yy === curDate.getFullYear()) {
    let mm2 = lang === "en" ? MON : (d.getMonth() + 1)
    let dd2 = d.getDate()
    return t("date_related.show_1", { mm: mm2, dd: dd2, day: DAY, hr, min })
  }

  // 中文时 yyyy/mm/dd hr:min
  if(lang === "zh-Hans" || lang === "zh-Hant") {
    return `${yy}-${mm}-${dd} ${hr}:${min}`
  }

  return `${MON} ${dd} ${yy}, ${hr}:${min}`
}


/**
 * 将一个时间戳转换为 "整 x 分"
 * @param stamp 待转换的时间戳
 * @param min 多少分钟来除，默认为 1，表示除以1分钟，若要化整到 5 分钟，则填 5
 */
export function formatStamp(
  stamp: number,
  min: number = 1
) {
  const A_MIN = 1000 * 60
  let divisor = min * A_MIN

  let remainder = stamp % divisor            // 准确时间戳到前一个整 x 分的差
  if(remainder === 0) return stamp
  let remainder2 = divisor - remainder       // 准确时间戳到后一个整 x 分的差
  if(remainder < remainder2) return stamp - remainder
  return stamp + remainder2
}

// 给定类型为 LiuRemindLater 的值，以当前时间为基准，计算出对应的时间戳
export function getLaterStamp(val: LiuRemindLater): number {
  const now = time.getTime()
  const MIN = 1000 * 60
  const HOUR = 60 * MIN
  const DAY = 24 * HOUR

  let diff = 0
  if(val === "30min") diff = 30 * MIN
  else if(val === "1hr") diff = HOUR
  else if(val === "2hr") diff = 2 * HOUR
  else if(val === "3hr") diff = 3 * HOUR
  else if(val === "tomorrow_this_moment") diff = DAY

  let laterStamp = now + diff
  return laterStamp
}

export function getEarlyStamp(
  whenStamp: number, 
  early_minute: LiuRemindEarly
) {
  const MIN = 1000 * 60
  const earlyStamp = whenStamp - (early_minute * MIN)
  return earlyStamp
}

// 用于发布前/编辑时，展示 "提醒我"
export function getRemindMeStr(
  t: ComposerTranslation,
  remindMe?: LiuRemindMe
) {
  if(!remindMe) return ""
  const { type, early_minute, later, specific_stamp } = remindMe
  if(type === "early" && typeof early_minute === "number") {
    const idx = REMIND_EARLY.indexOf(early_minute)
    if(idx >= 0) return t(`date_related.remind_early[${idx}]`)
    return t("date_related.remind_early_other", { min: String(early_minute) })
  }
  else if(type === "later" && later) {
    const idx = REMIND_LATER.indexOf(later)
    if(idx >= 0) return t(`date_related.remind_later[${idx}]`)
  }
  else if(type === "specific_time" && specific_stamp) {
    return showBasicDate(specific_stamp)
  }
  return ""
}

// 用于发布后，展示 "提醒我"
export function getRemindMeStrAfterPost(
  remindStamp: number,
  remindMe: LiuRemindMe
) {
  if(!remindStamp) return ""
  const { type, early_minute, later, specific_stamp } = remindMe
  const { t } = i18n.global
  const now = time.getTime()
  const diff = remindStamp - now

  if(type === "early" && typeof early_minute === "number") {
    const idx = REMIND_EARLY.indexOf(early_minute)
    if(idx >= 0) return t(`date_related.remind_early[${idx}]`)
    return t("date_related.remind_early_other", { min: String(early_minute) })
  }
  else if(type === "later" && later) {
    if(diff < 1000) {
      return showBasicDate(remindStamp)
    }
    const idx = REMIND_LATER.indexOf(later)
    if(idx >= 0) return t(`date_related.remind_later[${idx}]`)
  }
  else if(type === "specific_time" && specific_stamp) {
    return showBasicDate(specific_stamp)
  }

  return ""
}


export function getCountDownStr(
  diffStamp: number
) {

  const { t, locale } = i18n.global
  const lang = locale.value
  const SEC = 1000
  const MIN = 60 * SEC
  const HOUR = 60 * MIN
  const DAY = 24 * HOUR
  const DAY_10 = 10 * DAY
  const DAY_31 = 31 * DAY

  if(diffStamp <= 0) {
    return "00:00"
  }

  let remainder = 0
  let day_num = 0
  let hr_num = 0
  let min_num = 0
  let sec_num = 0
  let day = ""
  let hr = ""
  let min = ""
  let sec = ""

  // 剩下一小时内
  if(diffStamp < HOUR) {
    min_num = Math.floor(diffStamp / MIN)
    sec_num = Math.floor((diffStamp % MIN) / SEC)
    min = lang === "en" ? valTool.format0(min_num) : String(min_num)
    sec = lang === "en" ? valTool.format0(sec_num) : String(sec_num)
    return t("date_related.countdown_1", { min, sec })
  }

  // 剩下一天内
  if(diffStamp < DAY) {
    hr_num = Math.floor(diffStamp / HOUR)
    min_num = Math.floor((diffStamp % HOUR) / MIN)
    if(lang === "en") {
      return handleS({ hr_num, min_num })
    }

    hr = String(hr_num)
    min = String(min_num)
    return t("date_related.countdown_2", { hr, min })
  }

  // 剩下 10 天内
  if(diffStamp < DAY_10) {
    day_num = Math.floor(diffStamp / DAY)
    remainder = diffStamp % DAY
    hr_num = Math.floor(remainder / HOUR)
    remainder = remainder % HOUR
    min_num = Math.floor(remainder / MIN)
    if(lang === "en") {
      return handleS({ day_num, hr_num, min_num })
    }
    
    day = String(day_num)
    hr = String(hr_num)
    min = String(min_num)
    return t("date_related.countdown_3", { day, hr, min })
  }

  // 剩下一个月内
  if(diffStamp < DAY_31) {
    day_num = Math.floor(diffStamp / DAY)
    remainder = diffStamp % DAY
    hr_num = Math.ceil(remainder / HOUR)
    if(hr_num >= 24) {
      day_num += 1
      hr_num = 0
    }
    if(lang === "en") {
      return handleS({ day_num, hr_num })
    }
    day = String(day_num)
    hr = String(hr_num)
    return t("date_related.countdown_4", { day, hr })
  }

  // 剩下 超过一个月
  day_num = Math.ceil(diffStamp / DAY)
  if(lang === "en") {
    return handleS({ day_num })
  }
  day = String(day_num)
  return t("date_related.countdown_5", { day })
}

interface HSParam {
  day_num?: number
  hr_num?: number
  min_num?: number
  sec_num?: number
}

function handleS(opt: HSParam) {
  let tmp = ""
  let { day_num, hr_num, min_num, sec_num } = opt
  if(typeof day_num === "number") {
    tmp += `${day_num} day${day_num > 1 ? "s" : ""} `
  }
  if(typeof hr_num === "number") {
    tmp += `${hr_num} hr${hr_num > 1 ? "s" : ""} `
  }
  if(typeof min_num === "number") {
    tmp += `${min_num} min${min_num > 1 ? "s" : ""} `
  }
  if(typeof sec_num === "number") {
    tmp += `${sec_num} sec${sec_num > 1 ? "s" : ""} `
  }

  if(tmp) tmp += "remaining"

  return tmp
}

export function getEditedStr(
  createdStamp: number, 
  editedStamp?: number
) {
  if(!editedStamp) return
  if(createdStamp === editedStamp) return
  return showBasicDate(editedStamp)
}


interface BaseMenuItem {
  text_key: string
  [otherKey: string]: any
}

export function getRemindMenu(hasWhen: boolean) {
  const text_key = hasWhen ? "remind_early" : "remind_later"
  const _list = hasWhen ? REMIND_EARLY : REMIND_LATER
  const length = _list.length

  const list: BaseMenuItem[] = []
  for(let i=0; i<length; i++) {
    list.push({ text_key: `date_related.${text_key}[${i}]` })
  }
  return list
}