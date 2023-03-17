import type { ThreadShow } from "~/types/types-content";
import type { ShareViewData } from "./types"
import thirdLink from "~/config/third-link"
import { add } from "date-fns"
import liuUtil from "~/utils/liu-util";

export function handleLinks(svData: ShareViewData, thread: ThreadShow) {

  // 1. 处理 copLink
  handleCopyLink(svData, thread)

  // 2. 处理 google calendar
  handleGoogleCalendar(svData, thread)

  // 3. 处理 outlook
  handleOutlook(svData, thread)


}

function handleCopyLink(svData: ShareViewData, thread: ThreadShow) {
  const url = new URL(location.origin)
  url.pathname = "/" + thread._id
  svData.copyLink = url.toString()
}

function handleGoogleCalendar(svData: ShareViewData, thread: ThreadShow) {

  const url = new URL(thirdLink.GOOGLE_CALENDAR_ADD)
  const sp = url.searchParams

  const getDates = (stamp: number) => {
    const startDate = new Date(stamp)
    const endDate = add(startDate, { minutes: 30 })
    const s = liuUtil.getLiuDate(startDate, { utc: true })
    const e = liuUtil.getLiuDate(endDate, { utc: true })
    let dates = `${s.YYYY}${s.MM}${s.DD}T${s.hh}${s.mm}00Z/`
    dates += `${e.YYYY}${e.MM}${e.DD}T${e.hh}${e.mm}00Z`
    return dates
  }
  
  let text = thread.title ?? ""
  let details = thread.desc ?? ""

  if(!text && details) {
    text = details.split("\n")[0]
  }

  // 标题字数超过 60 时
  if(text.length > 60) {
    text = text.substring(0, 60)
  }
  // 详情字数超过 140 时
  if(details.length > 140) {
    details = details.substring(0, 140)
  }

  if(text) {
    sp.append("text", text)
  }
  if(details && details !== text) {
    sp.append("details", details)
  }

  if(thread.whenStamp) {
    sp.append("dates", getDates(thread.whenStamp))
  }
  else if(thread.remindStamp) {
    sp.append("dates", getDates(thread.remindStamp))
  }
  
  const gLink = url.toString()
  svData.googleCalendarLink = gLink
}

function handleOutlook(svData: ShareViewData, thread: ThreadShow) {

}