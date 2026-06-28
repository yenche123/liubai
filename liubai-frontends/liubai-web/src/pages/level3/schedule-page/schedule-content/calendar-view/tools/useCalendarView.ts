import { ref, computed, watch } from "vue"
import type { Ref } from "vue"
import { useI18n } from "vue-i18n"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  isSameMonth,
  isToday as dfIsToday,
} from "date-fns"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import cui from "~/components/custom-ui"
import { getLiuDate, showBasicDate } from "~/utils/liu-util/date-util"
import type { TlAtom } from "~/components/level1/thread-list/tools/types"

type TlInstance = {
  tlData?: { list: TlAtom[]; cssDetectOverflow: boolean }
  receiveOperation?: (...args: any[]) => void
  whenTapBriefing?: (...args: any[]) => void
} | null

// 本地时间的「某天」key，与 tl-util.handleDateText 的本地口径保持一致
function dayKey(d: Date): string {
  const { YYYY, MM, DD } = getLiuDate(d)
  return `${YYYY}-${MM}-${DD}`
}

export function useCalendarView(
  tlRef: Ref<TlInstance>,
  selectedDay: Ref<Date>,
) {
  const { t, locale } = useI18n()

  const _now = new Date(time.getTime())
  const curMonth = ref<Date>(startOfMonth(_now))
  // selectedDay 由外部注入，与日程页顶栏「+」的日期选择器共享

  // 当月区间（本地时间戳），下传给 headless thread-list 作为 CALENDAR_RANGE 查询边界
  const monthStart = computed(() => startOfMonth(curMonth.value).getTime())
  const nextMonthStart = computed(() =>
    startOfMonth(addMonths(curMonth.value, 1)).getTime())

  // 6×7 网格（周日起始），含上月末与下月初的溢出格子
  const gridDays = computed(() => {
    const s = startOfWeek(startOfMonth(curMonth.value), { weekStartsOn: 0 })
    const e = endOfWeek(endOfMonth(curMonth.value), { weekStartsOn: 0 })
    return eachDayOfInterval({ start: s, end: e })
  })

  // 星期表头（周日起始）：date_related.day_0..day_6
  const weekdayLabels = computed(() =>
    [0, 1, 2, 3, 4, 5, 6].map((i) => t(`date_related.day_${i}`)))

  // 头部标题：始终显示「年 + 月」，避免当前年只显示月份造成切换时不一致
  const monthTitle = computed(() => {
    const d = curMonth.value
    const mm = d.getMonth() + 1
    const yyyy = d.getFullYear()
    const lang = locale.value
    if(lang === "zh-Hans" || lang === "zh-Hant") {
      return t("date_related.show_5", { yyyy, mm })
    }
    const MON = t(`date_related.m_${valTool.format0(mm)}`)
    return t("date_related.show_5", { yyyy, mm: MON })
  })

  // 从 headless thread-list 读取已加载的整月数据
  const monthList = computed<TlAtom[]>(() => tlRef.value?.tlData?.list ?? [])

  // 按本地日期分桶（用于网格圆点 + 当天列表过滤）
  const dayMap = computed(() => {
    const m = new Map<string, TlAtom[]>()
    for(const atom of monthList.value) {
      const cs = atom.thread.calendarStamp
      if(!cs) continue
      const key = dayKey(new Date(cs))
      const arr = m.get(key)
      if(arr) arr.push(atom)
      else m.set(key, [atom])
    }
    return m
  })

  const selectedKey = computed(() => dayKey(selectedDay.value))
  const selectedDayList = computed(() => dayMap.value.get(selectedKey.value) ?? [])

  watch(selectedDay, (d) => {
    if(isSameMonth(d, curMonth.value)) return
    curMonth.value = startOfMonth(d)
  })

  const selectedDayTitle = computed(() => {
    const base = showBasicDate(selectedDay.value.getTime())
    if(dfIsToday(selectedDay.value)) {
      return `${base}（${t("common.today")}）`
    }
    return base
  })

  const prevMonth = () => {
    curMonth.value = startOfMonth(addMonths(curMonth.value, -1))
  }
  const nextMonth = () => {
    curMonth.value = startOfMonth(addMonths(curMonth.value, 1))
  }
  const goToday = () => {
    if(dfIsToday(selectedDay.value)) {
      cui.showSnackBar({ text_key: "calendar.already_today" })
      return
    }
    const n = new Date(time.getTime())
    curMonth.value = startOfMonth(n)
    selectedDay.value = n
  }
  const selectDay = (d: Date) => {
    selectedDay.value = d
  }

  const isCurrentMonth = (d: Date) => isSameMonth(d, curMonth.value)
  const isToday = (d: Date) => dfIsToday(d)
  const isSelected = (d: Date) => dayKey(d) === selectedKey.value
  const hasItems = (d: Date) => dayMap.value.has(dayKey(d))
  const dayItemCount = (d: Date) => dayMap.value.get(dayKey(d))?.length ?? 0
  const dayMarkerType = (d: Date) => {
    const n = dayItemCount(d)
    if(n > 5) return "more"
    if(n >= 3) return "dot"
    return "segment"
  }
  const dayMarkerPieces = (d: Date) => {
    const n = dayItemCount(d)
    if(n > 5) return []
    return Array.from({ length: n }, (_, i) => i)
  }
  const dayMarkerText = (d: Date) => dayItemCount(d) > 5 ? "5+" : ""
  const dayNum = (d: Date) => d.getDate()

  return {
    tlRef,
    curMonth,
    selectedDay,
    monthStart,
    nextMonthStart,
    gridDays,
    weekdayLabels,
    monthTitle,
    dayMap,
    selectedDayList,
    selectedDayTitle,
    prevMonth,
    nextMonth,
    goToday,
    selectDay,
    isCurrentMonth,
    isToday,
    isSelected,
    hasItems,
    dayItemCount,
    dayMarkerType,
    dayMarkerPieces,
    dayMarkerText,
    dayNum,
  }
}
