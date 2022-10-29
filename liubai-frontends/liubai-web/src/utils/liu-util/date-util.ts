import { isEqual, isToday, isTomorrow, isYesterday } from 'date-fns'
import { i18n } from '../../locales'
import { SupportedLocale } from '../../types/types-locale'
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