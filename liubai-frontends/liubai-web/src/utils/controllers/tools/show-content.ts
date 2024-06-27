import { ALLOW_DEEP_TYPES } from "~/config/atom";
import type { LiuContent, LiuNodeType } from "~/types/types-atom";
import type { GetChaRes } from "~/utils/liu-api/tools/types";
import valTool from "~/utils/basic/val-tool";
import liuApi from "~/utils/liu-api";
import reg_exp from "~/config/regular-expressions";

type ParseType = "phone" | ""
let cha: GetChaRes | undefined

export function addSomethingWhenBrowsing(
  list: LiuContent[],
  parentType?: LiuNodeType
) {

  cha = liuApi.getCharacteristic()

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { type, content } = v

    if(type === "paragraph" && content) {
      v.content = _parseTextsForLink(content)
      continue
    }
    
    // 检查当前节点是否允许再嵌套其他节点
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

    // 解析 phoneNumber, 其中正则末尾的 (?!\w) 表示手机号后面不要接英文字母、数字和下划线
    if(cha?.isMobile) {
      const listTel = _innerParse(text, reg_exp.phone, "phone")
      if(listTel) {
        list.splice(i, 1, ...listTel)
        i--
        continue
      }
    }

  }

  return list
}


function checkPhoneNumber(
  mTxt: string,
  text: string,
  startIdx: number,
) {
  // 1. 检查是否为日期格式 YYYY-MM-DD
  const regDate = /\d{4}\-\d{2}-\d{2}/
  const isYYYYMMDD = regDate.test(mTxt)
  if(isYYYYMMDD) {
    return false
  }

  // 2. 检查是否为日期格式 YYYYMMDD
  const res2 = checkYearMonDate(mTxt)
  if(res2) return false

  // 3. 检查前一个字符是否为数字
  if(startIdx > 0) {
    const prevChar = text[startIdx - 1]
    const isNum = valTool.isStringAsNumber(prevChar)
    if(isNum) return false
  }

  return true
}

function checkYearMonDate(mTxt: string) {
  if(mTxt.length !== 8) return false
  
  const y1 = mTxt.substring(0, 4)
  const y2 = Number(y1)
  const m1 = mTxt.substring(4, 6)
  const m2 = Number(m1)
  const d1 = mTxt.substring(6, 8)
  const d2 = Number(d1)

  // 1. check basically
  if(isNaN(y2) || isNaN(m2) || isNaN(d2)) return false
  if(y2 < 1000) return false
  if(m2 > 13 || m2 < 1) return false
  if(d2 > 31 || d2 < 1) return false

  // 2. check whether the date is available or not
  const mIdx = m2 - 1
  const date = new Date(y2, mIdx, d2)
  if(date.getMonth() !== mIdx) return false
  if(date.getDate() !== d2) return false

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