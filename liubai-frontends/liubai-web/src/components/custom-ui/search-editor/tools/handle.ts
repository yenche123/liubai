
import type { 
  SearchEditorData,
} from "./types"

interface SearchItemBase {
  atomId: string
  [otherKey: string]: any
}

export function handleKeyDown(
  seData: SearchEditorData,
  diff: 1 | -1,
  e: KeyboardEvent,
) {

  let { trimTxt, indicator, suggestList, recentList, innerList, thirdList } = seData

  console.log("000000000000")

  let newIndicator = ""
  if(trimTxt) {
    newIndicator = findIndicator(indicator, diff, innerList, [thirdList])
    if(!newIndicator) {
      newIndicator = findIndicator(indicator, diff, thirdList, [innerList])
    }
  }
  else {
    newIndicator = findIndicator(indicator, diff, suggestList, [recentList])
    if(!newIndicator) {
      newIndicator = findIndicator(indicator, diff, recentList, [suggestList])
    }
  }

  console.log("newIndicator: ", newIndicator)

  if(newIndicator) {
    seData.indicator = newIndicator
    e.preventDefault()
  }
}



function findIndicator(
  indicator: string,
  diff: 1 | -1,
  currentList: SearchItemBase[],
  sequence: Array<SearchItemBase[]>,  // currentList 之后不包含本地的其他列表的列表
) {
  let idx = currentList.findIndex(v => v.atomId === indicator)
  if(idx < 0) return ""

  const curLen = currentList.length

  let newIndicator = ""
  let newIdx = idx + diff

  // 如果超出位数
  if(newIdx >= curLen) {
    const tmpList = sequence.find(v => v.length > 0)
    if(tmpList) {
      newIndicator = tmpList[0].atomId
    }
    else {
      newIndicator = currentList[0].atomId
    }
  }
  else if(newIdx < 0) {
    const tmpList = sequence.reverse().find(v => v.length > 0)
    if(tmpList) {
      newIndicator = tmpList[tmpList.length - 1].atomId
    }
    else {
      newIndicator = currentList[curLen - 1].atomId
    }
  }
  else {
    newIndicator = currentList[newIdx].atomId
  }
  
  return newIndicator
}