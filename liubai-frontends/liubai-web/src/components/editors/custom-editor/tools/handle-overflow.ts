
import type { CeState } from "./atom-ce"
import { getRowNum } from "~/utils/transfer-util/text"

export function handleOverflow(
  state: CeState,
) {
  const ec = state?.editorContent
  const text = ec?.text
  const json = ec?.json
  if(!text || !json) {
    state.overflowType = "visible"
    return
  }

  const textList = text.split("\n")
  const len1 = textList.length
  if(len1 > 10) {
    state.overflowType = "auto"
    return
  }

  const list = json.content ?? []
  const num = getRowNum(list)
  if(num > 6) {
    state.overflowType = "auto"
    return
  }

  if(text.length > 500) {
    state.overflowType = "auto"
    return
  }

  state.overflowType = "visible"
}