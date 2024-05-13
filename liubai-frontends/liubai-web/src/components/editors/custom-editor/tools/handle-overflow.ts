
import valTool from "~/utils/basic/val-tool"
import type { CeData } from "./types"
import { getRowNum } from "~/utils/transfer-util/text"

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