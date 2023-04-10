
import type { TipTapJSONContent } from "~/types/types-editor"
import type { LiuContent } from "~/types/types-atom"
import valTool from "../basic/val-tool"
import { ALLOW_DEEP_TYPES } from "~/config/atom"

// 装载 link
export function equipLink(list: TipTapJSONContent[]) {
  if(list.length < 1) return []


  for(let i=0; i<list.length; i++) {
    
    const v = list[i]
    const type = v.type
    if(!type) continue
    if(type === "paragraph" && v.content) {
      v.content = _parseTextsForLink(v.content)
      continue
    }

    const allowDeep = ALLOW_DEEP_TYPES.includes(type)
    if(allowDeep && v.content) {
      v.content = equipLink(v.content)
    }
  }

  return list
}


function _parseTextsForLink(content: TipTapJSONContent[]): TipTapJSONContent[] {
  if(content.length < 1) return []

  for(let i=0; i<content.length; i++) {
    const v = content[i]
    const { type, marks, text } = v
    if(!type || type !== "text" || !text) continue
    
    // 已经有样式，就 pass
    if(marks && marks.length) continue

    // 解析 @xxx@aaa.bbb
    const regSocialLink = /@[\w\.-]{2,32}@[\w-]{1,32}\.\w{2,32}[\w\.-]*/g
    let list0 = _innerParse(text, regSocialLink, "social_link")
    if(list0) {
      content.splice(i, 1, ...list0)
      i--
      continue
    }

    // 解析 email
    const regEmail = /[\w\.-]{1,32}@[\w-]{1,32}\.\w{2,32}[\w\.-]*/g
    let list = _innerParse(text, regEmail, "email")
    if(list) {
      content.splice(i, 1, ...list)
      i--
      continue
    }

    // 解析 一般链接
    const regUrl = /[\w\./:-]*\w{1,32}\.\w{2,6}\S*/g
    let list2 = _innerParse(text, regUrl, "url")
    if(list2) {
      content.splice(i, 1, ...list2)
      i--
      continue
    }
  }

  return content
}


/**
 * 给定字符串和正则，若有命中的，则返回新的待取代的 list
 * 否则返回 undefined
 */
function _innerParse(
  text: string, 
  reg: RegExp,
  forType?: "url" | "email" | "social_link",
): TipTapJSONContent[] | undefined {

  const matches = text.matchAll(reg)
  let tmpList: TipTapJSONContent[] = []
  let tmpEndIdx = 0

  for(let match of matches) {
    let mTxt = match[0]
    let mLen = mTxt.length
    if(forType === "email" && mLen < 6) continue
    if(forType === "social_link" && mLen < 7) continue
    if(forType === "url" && mLen < 8) continue
    if(forType === "url" && !_checkUrlMore(mTxt)) continue

    let href = forType === "email" ? `mailto:${mTxt}` : mTxt
    if(forType === "social_link") {
      href = _handleSocialLink(mTxt)
    }
    if(forType === "url") {
      const idx = href.indexOf("://")
      if(idx < 0) {
        href = `https://` + href
      }
    }

    const startIdx = match.index
    if(startIdx === undefined) continue
    const endIdx = startIdx + mLen
    const obj: TipTapJSONContent = {
      type: "text",
      text: mTxt,
      marks: [
        {
          "type": "link",
          "attrs": { href, target: "_blank", class: null }
        }
      ]
    }

    if(startIdx > 0) {
      const prevLetter = text[startIdx - 1]
      if(forType === "url" && (prevLetter === "@" || prevLetter === "#")) continue

      const frontObj = {
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
    const behindObj = {
      type: "text",
      text: text.substring(tmpEndIdx)
    }
    tmpList.push(behindObj)
  }

  return tmpList
}

/**
 * 处理 @xxx@aa.com 返回 href
 * @param text 长这样 "@xxx@aa.com"
 */
function _handleSocialLink(text: string) {
  let tmpList = text.split("@")
  let username = tmpList[1]
  let domain = tmpList[2]

  if(!username || !domain) {
    return ""
  }

  if(domain === "twitter.com") {
    return `https://twitter.com/${username}`
  }

  if(domain === "instagram.com") {
    return `https://instagram.com/${username}`
  }

  if(domain === "youtube.com") {
    return `https://youtube.com/@${username}`
  }

  return `https://elk.zone/${domain}/@${username}`
}


function _checkUrlMore(text: string) {
  const reg = /^[\d\.-]{2,}$/   // 避免字符串里 全是: 数字 . - 的情况
  if(reg.test(text)) return false
  const engNum = _howManyLowerCase(text)
  if(engNum < 3) return false
  if(text.indexOf("http") === 0) return true
  const manNum = valTool.getChineseCharNum(text)
  if(manNum > 2 && !text.includes("/")) return false
  return true
}

function _howManyLowerCase(text: string) {
  if(!text || text.length < 1) return 0
  let list = text.split("")
  let num = 0
  list.forEach(v => {
    if(v >= "a" && v <= "z") num++
  })
  return num
}


// 卸载 link
export function depriveLink(list: LiuContent[]) {
  const newList = valTool.copyObject(list)
  for(let i=0; i<newList.length; i++) {
    const v = newList[i]
    let { type, content, marks } = v
    const canDeepTypes = [
      "paragraph", 
      "orderedList", 
      "bulletList", 
      "listItem", 
      "blockquote"
    ]
    if(canDeepTypes.includes(type) && content) {
      v.content = depriveLink(content)
      continue
    }

    if(marks) {
      marks = marks.filter(v2 => v2.type !== "link")
      if(marks.length < 1) delete v.marks
    }
  }

  return newList
}