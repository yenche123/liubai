import { ALLOW_DEEP_TYPES } from "~/config/atom";
import type { LiuContent, LiuNodeType } from "~/types/types-atom";
import valTool from "~/utils/basic/val-tool";

type ParseType = "phone" | ""

export function addSomethingWhenBrowsing(
  list: LiuContent[],
  parentType?: LiuNodeType
) {

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { type, content } = v

    if(type === "paragraph" && content) {
      v.content = _parseTextsForLink(content)
      continue
    }
    
    const allowDeep = ALLOW_DEEP_TYPES.includes(type)
    if(allowDeep && content) {
      v.content = addSomethingWhenBrowsing(content, type)
    }
  }

  return list
}

/**
 * 在浏览时，装载一些 link，比如 tel
 * @param list paragraph 节点的 content
 */
function _parseTextsForLink(
  list: LiuContent[]
) {
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { type, marks, text } = v
    if(type !== "text" || !text) continue

    // 已经有样式，就 pass
    if(marks?.length) continue

    // 解析 phoneNumber, 其中正则末尾的 (?!\d) 表示手机号后面不要接数字
    const regTel = /\+?\d[\d\-]{6,15}(?!\d)/g
    const listTel = _innerParse(text, regTel, "phone")
    if(listTel) {
      list.splice(i, 1, ...listTel)
      i--
      continue
    }

  }

  return list
}


function checkPhoneNumber(
  mTxt: string,
  text: string,
  startIdx: number,
) {
  // 检查是否为日期格式
  const regDate = /\d{4}\-\d{2}-\d{2}/
  const isYYYYMMDD = regDate.test(mTxt)
  if(isYYYYMMDD) {
    return false
  }

  // 检查前一个字符是否为数字
  if(startIdx > 0) {
    const prevChar = text[startIdx - 1]
    const isNum = valTool.isStringAsNumber(prevChar)
    if(isNum) return false
  }

  return true
}

function _innerParse(
  text: string, 
  reg: RegExp,
  parseType: ParseType,
): LiuContent[] | undefined {

  const matches = text.matchAll(reg)
  let tmpList: LiuContent[] = []
  let tmpEndIdx = 0
  const isPhone = parseType === "phone"

  for(let match of matches) {
    let mTxt = match[0]
    let mLen = mTxt.length
    const startIdx = match.index
    if(startIdx === undefined) continue
    if(isPhone) {
      // 如果是手机号 做更多判断
      const res = checkPhoneNumber(mTxt, text, startIdx)
      if(!res) continue
    }

    const endIdx = startIdx + mLen

    let href = isPhone ? `tel:${mTxt}` : mTxt
    let openTarget = isPhone ? '_self' : '_blank'

    const obj: LiuContent = {
      type: "text",
      text: mTxt,
      marks: [
        {
          "type": "link",
          "attrs": { href, target: openTarget, class: null }
        }
      ]
    }

    if(startIdx > 0) {
      const frontObj: LiuContent = {
        type: "text",
        text: text.substring(tmpEndIdx, startIdx),
      }
      tmpList.push(frontObj, obj)
    }
    else {
      tmpList.push(obj)
    }
    tmpEndIdx = endIdx
  }

  if(tmpList.length < 1) return

  if(text.length > tmpEndIdx) {
    const behindObj: LiuContent = {
      type: "text",
      text: text.substring(tmpEndIdx),
    }
    tmpList.push(behindObj)
  }

  return tmpList
}