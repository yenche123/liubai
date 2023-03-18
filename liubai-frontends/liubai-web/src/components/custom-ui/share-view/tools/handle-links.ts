import type { ThreadShow } from "~/types/types-content";
import type { ShareViewData, ExportData, IcsDateTime } from "./types"
import thirdLink from "~/config/third-link"
import { add } from "date-fns"
import liuUtil from "~/utils/liu-util";
import { createEvent } from "ics"
import type { EventAttributes, Alarm } from "ics"
import { i18n } from "~/locales";

export function handleLinks(svData: ShareViewData, thread: ThreadShow) {

  // 1. 处理 copLink
  handleCopyLink(svData, thread)

  // 获取要传给外部应用的 title / desc
  const ed = getExportData(thread)

  // 2. 处理 google calendar
  handleGoogleCalendar(svData, thread, ed)

  // 3. 处理 outlook
  handleOutlook(svData, thread, ed)

  // 4. 处理 .ics
  handleIcs(svData, thread, ed)
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

  let exportData: ExportData = {
    title, desc, startStamp
  }

  let alarm: Alarm = {
    action: "display",
    description: "Reminder",
  }
  if(thread.remindMe && thread.remindStamp) {
    const r = thread.remindMe
    if(r.type === "early" && typeof r.early_minute === "number") {
      alarm.trigger = { minutes: r.early_minute, before: true }
      exportData.alarms = [alarm]
    }
  }

  return exportData
}

function handleCopyLink(svData: ShareViewData, thread: ThreadShow) {
  const url = new URL(location.origin)
  url.pathname = "/" + thread._id
  svData.copyLink = url.toString()
}

function handleGoogleCalendar(
  svData: ShareViewData, 
  thread: ThreadShow,
  ed: ExportData,
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

  if(ed.title) {
    sp.append("text", ed.title)
  }
  if(ed.desc) {
    sp.append("details", ed.desc)
  }
  if(ed.startStamp) {
    sp.append("dates", getDates(ed.startStamp))
  }
  
  const gLink = url.toString()
  svData.googleCalendarLink = gLink
}

function handleOutlook(
  svData: ShareViewData, 
  thread: ThreadShow,
  ed: ExportData,
) {
  const url = new URL(thirdLink.OUTLOOK_ADD)
  const sp = url.searchParams

  if(ed.title) {
    sp.append("subject", ed.title)
  }
  if(ed.desc) {
    sp.append("body", ed.desc)
  }

  const getStartDt = (stamp: number) => {
    const startDate = new Date(stamp)
    const s = liuUtil.getLiuDate(startDate, { utc: true })
    let startDt = `${s.YYYY}-${s.MM}-${s.DD}T${s.hh}:${s.mm}:00+00:00`
    return startDt
  }

  if(ed.startStamp) {
    sp.append("startdt", getStartDt(ed.startStamp))
  }

  const oLink = url.toString()
  svData.outlookLink = oLink
}


function handleIcs(
  svData: ShareViewData, 
  thread: ThreadShow,
  ed: ExportData,
) {
  if(!ed.startStamp) {
    svData.icsLink = ""
    return
  }

  const t = i18n.global.t
  const s = liuUtil.getLiuDate(new Date(ed.startStamp))
  const s2 = liuUtil.getLiuDate(new Date(thread.createdStamp))
  const s3 = liuUtil.getLiuDate(new Date(thread.editedStamp))
  
  const event: EventAttributes = {
    start: [Number(s.YYYY), Number(s.MM), Number(s.DD), Number(s.hh), Number(s.mm)],
    startInputType: "local",
    duration: { minutes: 30 },
    title: ed.title,
    description: ed.desc,
    uid: thread._id,
    categories: [t('hello.appName')],
    alarms: ed.alarms,
    created: [Number(s2.YYYY), Number(s2.MM), Number(s2.DD), Number(s2.hh), Number(s2.mm)],
    lastModified: [Number(s3.YYYY), Number(s3.MM), Number(s3.DD), Number(s3.hh), Number(s3.mm)],
  }

  const receiveIcs = (plainText: string) => {
    const file = new File([plainText], "liubai.ics", { type: "text/calendar" })
    const [url] = liuUtil.createObjURLs([file])
    svData.icsLink = url
  }

  createEvent(event, (err, val) => {
    if(err) {
      console.warn("createEvent err: ")
      console.log(err)
      console.log(" ")

      svData.icsLink = ""
      return
    }

    receiveIcs(val)
  })
}