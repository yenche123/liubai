
import valTool from "~/utils/basic/val-tool"
import type { CeData } from "./types"
import { getRowNum } from "~/utils/transfer-util/text"
import type { ContentLocalTable } from "~/types/types-table"
import type { LiuRemindMe } from "~/types/types-atom"

export function handleOverflow(
  ceData: CeData,
) {
  const ec = ceData?.editorContent
  const text = ec?.text
  const json = ec?.json
  if(!text || !json) {
    ceData.overflowType = "auto"
    return
  }

  const textList = text.split("\n")
  const len1 = textList.length
  if(len1 > 10) {
    ceData.overflowType = "auto"
    return
  }

  const list = json.content ?? []
  const num = getRowNum(list)
  if(num > 3) {
    ceData.overflowType = "auto"
    return
  }

  const charNum = valTool.getTextCharNum(text)
  // console.log("charNum: ", charNum)
  // console.log(" ")

  if(charNum > 300) {
    ceData.overflowType = "auto"
    return
  }

  ceData.overflowType = "visible"
}

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