import type { ThreadShow } from "~/types/types-content";
import type { ShareViewData, ExportData } from "./types"
import thirdLink from "~/config/third-link"
import { add } from "date-fns"
import liuUtil from "~/utils/liu-util";

export function handleLinks(svData: ShareViewData, thread: ThreadShow) {

  // 1. 处理 copLink
  handleCopyLink(svData, thread)

  // 获取要传给外部应用的 title / desc
  const td = getExportData(thread)

  // 2. 处理 google calendar
  handleGoogleCalendar(svData, thread, td)

  // 3. 处理 outlook
  handleOutlook(svData, thread, td)

  // 4. 处理 .ics
  handleIcs(svData, thread, td)
}

function getExportData(thread: ThreadShow) {
  let title = thread.title ?? ""
  let desc = thread.desc ?? ""

  if(!title && desc) {
    const tmpList = desc.split("\n")
    title = tmpList[0]
  }

  // 标题字数超过 60 时
  if(title.length > 60) {
    title = title.substring(0, 60)
  }
  // 详情字数超过 140 时
  if(desc.length > 140) {
    desc = desc.substring(0, 140)
  }

  title = title.trim()
  desc = desc.trim()

  if(desc && title === desc) {
    desc = ""
  }

  let startStamp: number | undefined
  if(thread.whenStamp) {
    startStamp = thread.whenStamp
  }
  else if(thread.remindStamp) {
    startStamp = thread.remindStamp
  }

  return { title, desc, startStamp }
}

function handleCopyLink(svData: ShareViewData, thread: ThreadShow) {
  const url = new URL(location.origin)
  url.pathname = "/" + thread._id
  svData.copyLink = url.toString()
}

function handleGoogleCalendar(
  svData: ShareViewData, 
  thread: ThreadShow,
  td: ExportData,
) {
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

  if(td.title) {
    sp.append("text", td.title)
  }
  if(td.desc) {
    sp.append("details", td.desc)
  }
  if(td.startStamp) {
    sp.append("dates", getDates(td.startStamp))
  }
  
  const gLink = url.toString()
  svData.googleCalendarLink = gLink
}

function handleOutlook(
  svData: ShareViewData, 
  thread: ThreadShow,
  td: ExportData,
) {
  const url = new URL(thirdLink.OUTLOOK_ADD)
  const sp = url.searchParams

  if(td.title) {
    sp.append("subject", td.title)
  }
  if(td.desc) {
    sp.append("body", td.desc)
  }

  const getStartDt = (stamp: number) => {
    const startDate = new Date(stamp)
    const s = liuUtil.getLiuDate(startDate, { utc: true })
    let startDt = `${s.YYYY}-${s.MM}-${s.DD}T${s.hh}:${s.mm}:00+00:00`
    return startDt
  }

  if(td.startStamp) {
    sp.append("startdt", getStartDt(td.startStamp))
  }

  const oLink = url.toString()
  svData.outlookLink = oLink
}


function handleIcs(
  svData: ShareViewData, 
  thread: ThreadShow,
  td: ExportData,
) {
  if(!td.startStamp) {
    svData.icsLink = ""
    return
  }
  

}