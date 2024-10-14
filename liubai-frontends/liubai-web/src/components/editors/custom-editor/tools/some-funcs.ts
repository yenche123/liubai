import { defaultData, type CeData } from "./types"
import type { ContentLocalTable } from "~/types/types-table"
import type { LiuRemindMe } from "~/types/types-atom"
import time from "~/utils/basic/time"

// 从 thread 中判断 "xx 之后提醒我" 这个值怎么转成确切时间点
export function getRemindMeFromThread(
  thread: ContentLocalTable
): LiuRemindMe | undefined {
  const oldRemindMe = thread.remindMe
  if(!oldRemindMe) return
  const oldType = oldRemindMe.type
  if(oldType === "specific_time" || oldType === "early") return oldRemindMe
  const remindStamp = thread.remindStamp
  if(!remindStamp) return
  const newRemindMe: LiuRemindMe = {
    type: "specific_time",
    specific_stamp: remindStamp
  }
  return newRemindMe
}

export function checkIfEditorHasData(
  ceData: CeData,
) {
  const text = ceData.editorContent?.text.trim()
  if(text?.length) return true

  const { files, images } = ceData
  if(files?.length) return true
  if(images?.length) return true

  return false
}

export function checkCanSubmit(
  ceData: CeData,
) {
  const title = ceData.title?.trim()
  const imgLength = ceData.images?.length
  const fileLength = ceData.files?.length
  const text = ceData.editorContent?.text.trim()
  let newCanSubmit = Boolean(imgLength) || Boolean(text) || Boolean(fileLength)
  newCanSubmit = newCanSubmit || Boolean(title)
  ceData.canSubmit = newCanSubmit
}

// reset but keep editorContent
export function resetBasicCeData(
  ceData: CeData,
) {
  ceData.lastLockStamp  = time.getTime()
  delete ceData.draftId
  delete ceData.threadEdited
  ceData.visScope = defaultData.visScope
  ceData.tagIds = []
  delete ceData.title
  delete ceData.whenStamp
  delete ceData.remindMe
  delete ceData.images
  delete ceData.files
  delete ceData.lastEditStamp
  delete ceData.stateId
  ceData.canSubmit = false
}