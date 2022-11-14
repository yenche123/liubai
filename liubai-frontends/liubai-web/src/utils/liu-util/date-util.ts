import { isEqual, isToday, isTomorrow, isYesterday } from 'date-fns'
import { i18n } from '../../locales'
import { LiuRemindEarly, LiuRemindLater } from '../../types/types-atom'
import { SupportedLocale } from '../../types/types-locale'
import time from '../basic/time'
import valTool from '../basic/val-tool'

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

// 在编辑态时，展示时间
export function showBasicDate(val: Date | number, lang?: SupportedLocale) {
  let d = typeof val === "number" ? new Date(val) : val
  const curDate = new Date()
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
// 并且四舍五入到对应的 "整分" 上
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
  return formatStamp(laterStamp)
}

export function getEarlyStamp(
  whenStamp: number, 
  early_minute: LiuRemindEarly
) {
  const MIN = 1000 * 60
  const earlyStamp = whenStamp - (early_minute * MIN)
  return formatStamp(earlyStamp)
}