


export type OpenType = "closed_by_user" | "closed_by_auto" | "opened"

export type ThreadListViewType = "TRASH" | "TAG" | "FAVORITE"
  | "PINNED" | "INDEX" | "STATE" | "CALENDAR" | "CALENDAR_RANGE"
  | "PAST"

// 以下三个都是「日历类」视图，名字相近但用途不同，注意区分：
//
// CALENDAR:       首页顶部「今日 / 未来 24 小时」摘要卡片（index-content.vue）
//                 固定加载当前时间前后约一天，再由 filterForCalendar 过滤出展示窗口
// CALENDAR_RANGE: 日历页（/calendar）整月视图的 headless 数据引擎（calendar-view.vue）
//                 加载 calendarStamp ∈ [calendarStart, calendarEnd) 的动态，整月一次性拉完
// PAST:           过去页（/past），从现在起往过去翻页
//
// 曾经还有 TODAY_FUTURE（旧日程页，从今天起往未来翻页），改版为日历页后已从前端移除；
// 后端仍保留该值以兼容未更新缓存的旧客户端
//
// 注意：这些值会通过 sync-get 发给后端（wire protocol），不要轻易重命名；
// 若要改名，后端 schema 需要兼容新旧两个值并等旧客户端淘汰后再移除

export type ThreadCardShowType = "normal" | "hiding"

export type CursorHorizontalResize = "ew-resize" | "e-resize" | "w-resize"

// LiuDisplayType
export type LiuDisplayType = "list" | "detail"

// SMS code status
export type SmsStatus = "can_tap" | "loading" | "counting"

// 自定义页面内的视图单元
export interface BasicView {
  show: boolean
  id: string
}

export interface LiuImgData {
  src: string
  naturalWidth: number
  naturalHeight: number
}
