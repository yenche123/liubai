import type { ThreadShow } from "~/types/types-content";
import type { ShareViewData } from "./types"

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

}

function handleOutlook(svData: ShareViewData, thread: ThreadShow) {

}