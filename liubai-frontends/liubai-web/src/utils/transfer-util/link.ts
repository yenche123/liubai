
import type { TipTapJSONContent } from "~/types/types-editor"
import type { LiuContent, LiuMarkAtom } from "~/types/types-atom"
import valTool from "../basic/val-tool"
import { ALLOW_DEEP_TYPES } from "~/config/atom"
import reg_exp from "~/config/regular-expressions"
import liuUtil from "../liu-util"
import usefulTool from "../basic/useful-tool"

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


function _parseTextsForLink(
  content: TipTapJSONContent[]
): TipTapJSONContent[] {
  if(content.length < 1) return []

  for(let i=0; i<content.length; i++) {
    const v = content[i]
    const { type, marks, text } = v
    if(!type || type !== "text" || !text) continue
    
    // 已经有样式，就 pass
    if(marks && marks.length) continue

    // 解析 @xxx@aaa.bbb
    const regSocialLink = reg_exp.social_link
    let list0 = _innerParse(text, regSocialLink, "social_link")
    if(list0) {
      content.splice(i, 1, ...list0)
      i--
      continue
    }

    // 解析 markdown 格式的链接
    const regMdLink = reg_exp.md_link
    const newText = _encodeBraces(text)
    const list1 = _innerParse(newText, regMdLink, "markdown_link")
    if(list1) {
      content.splice(i, 1, ...list1)
      i--
      continue
    }

    // 解析 email
    const regEmail = reg_exp.email
    const list2 = _innerParse(text, regEmail, "email")
    if(list2) {
      content.splice(i, 1, ...list2)
      i--
      continue
    }

    // 解析 一般链接
    const regUrl = reg_exp.url
    const list3 = _innerParse(text, regUrl, "url")
    if(list3) {
      content.splice(i, 1, ...list3)
      i--
      continue
    }

    // 更加精准地解析链接
    const regHttpUrl = reg_exp.exact_url
    const list4 = _innerParse(text, regHttpUrl, "url")
    if(list4) {
      content.splice(i, 1, ...list4)
      i--
      continue
    }

  }

  return content
}

/** 对原文本中的 `(` 和 `)` 进行编码，再返回新的文本。
 *  本方法采用递归的方法，从前方开始匹配，若发现链接，
 *  则把文本拆解成 链接 和 剩余文本 两个部分，剩余文本再重新传进本函数
 *  进行递归
*/
function _encodeBraces(text: string) {
  if(!text) return ""

  // 匹配精确的链接
  const matches = text.matchAll(reg_exp.exact_url)

  let result = ""
  for(let match of matches) {
    const startIdx = match.index
    if(startIdx === undefined) continue

    let link = match[0]

    const length = link.length
    let endIdx = startIdx + length
    
    if(startIdx > 0) {
      result += text.substring(0, startIdx)
    }

    const b = usefulTool.encodeBraces(link)
    
    if(b.str !== link) {
      link = b.str
      if(b.lastCharDeleted) endIdx -= 1
    }
    
    result += link
    let rest_text = text.substring(endIdx)
    rest_text = _encodeBraces(rest_text)
    result += rest_text
    break
  }
  if(!result) {
    result = text
  }
  return result
}


/**
 * 给定字符串和正则，若有命中的，则返回新的待取代的 list
 * 否则返回 undefined
 */
function _innerParse(
  text: string, 
  reg: RegExp,
  forType?: "url" | "email" | "social_link" | "markdown_link",
): TipTapJSONContent[] | undefined {

  const matches = text.matchAll(reg)
  let tmpList: TipTapJSONContent[] = []
  let tmpEndIdx = 0

  for(let match of matches) {
    let mTxt = match[0]
    let mLen = mTxt.length
    let startIdx = match.index

    if(startIdx === undefined) continue

    if(forType === "email" && mLen < 6) continue
    if(forType === "url" && mLen < 6) continue
    if(forType === "url" && !_checkUrl_1(mTxt)) continue    

    let href = mTxt
    const m1 = match[1]
    const m2 = match[2]

    if(forType === "markdown_link") {
      if(!m1 || !m2) continue
      mTxt = m1
      href = m2

      // console.log("mTxt: ", mTxt)
      // console.log("href: ", href)
      // console.log(" ")

      const idx1 = href.indexOf("://")
      const idx2 = href.indexOf("mailto")
      const isEmail = liuUtil.check.isEmail(href)

      if(idx2 !== 0) {
        if(isEmail) href = `mailto:` + href
        else if(idx1 < 0) href = `https://` + href
      }
    }
    else if(forType === "email") {
      href = `mailto:${mTxt}`
    }
    else if(forType === "social_link") {
      if(m1 === undefined || m2 === undefined) continue
      mTxt = m2
      mLen = mTxt.length
      startIdx = startIdx + m1.length

      if(mLen < 7) continue
      href = _handleSocialLink(mTxt)
    }
    else if(forType === "url") {
      href = _handleURL(href)
      if(!_checkUrl_2(href)) continue
    }

    if(!mTxt) continue
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

    if(startIdx > 0 && tmpEndIdx < startIdx) {
      const prevLetter = text[startIdx - 1]
      if(forType === "url" || forType === "email") {
        if(prevLetter === "@" || prevLetter === "#") continue
        if(prevLetter === "/" || prevLetter === "?") continue
        if(prevLetter === "!" || prevLetter === "\\") continue
      }

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


// 处理通用链接
// 1. 加上协议 https
// 2. 处理链接里的参数，把 &amp; 全替换成 &
function _handleURL(text: string) {
  const idx = text.indexOf("://")
  if(idx < 0) {
    text = `https://` + text
  }

  try {
    const url = new URL(text)
    const s = url.search
    if(s.length > 1) {
      url.search = s.replace(/&amp;/g, "&")
      text = url.toString()
    }
  }
  catch(err) {}

  return text
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

  if(domain === "threads.net") {
    return `https://www.threads.net/@${username}`
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

// 自定义检查 text 是否为一个链接
function _checkUrl_1(text: string) {
  let url = valTool.getURL(text)
  if(!url) {
    url = valTool.getURL(`https://${text}`)
    if(!url) {
      return false
    }
  }

  const firstChar = text[0]
  if(firstChar === "/" || firstChar === ":") return false
  if(firstChar === "-" || firstChar === ".") return false

  const reg = /^[^a-zA-Z]{2,}$/   // 避免字符串里 全是: 数字 . - 的情况
  if(reg.test(text)) {
    // console.log("正则检测失败....")
    // console.log(" ")
    return false
  }
  const engNum = _howManyLowerCase(text)
  if(engNum < 3) return false
  if(text.startsWith("http")) return true
  const manNum = valTool.getChineseCharNum(text)
  if(manNum > 2 && !text.includes("/")) return false
  return true
}

// 当链接经 _handleURL() 处理后
// 使用 URL.canParse 对 _handleURL 的结果 href 再次进行链接检查
function _checkUrl_2(href: string) {
  if(typeof URL.canParse !== "undefined") {
    const res = URL.canParse(href)
    return res
  }
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
export function depriveLink(
  list: LiuContent[] | TipTapJSONContent[]
) {
  const newList = valTool.copyObject(list)
  for(let i=0; i<newList.length; i++) {
    const v = newList[i]
    let { type, content, marks, text } = v
    const canDeepTypes = [
      "paragraph", 
      "orderedList", 
      "bulletList", 
      "listItem", 
      "blockquote"
    ]
    if(type && canDeepTypes.includes(type) && content) {
      v.content = depriveLink(content)
      continue
    }

    if(!marks || !text) continue

    let linkMark: LiuMarkAtom | undefined
    let index = -1
    marks.forEach((v2, i2) => {
      if(v2.type === "link") {
        linkMark = v2 as LiuMarkAtom
        index = i2
      }
    })

    if(!linkMark || index < 0) continue
    const href = linkMark.attrs?.href
    if(typeof href !== "string") continue

    // text 和 href 可能一致（只要 text 包含在 href 里即可）
    // 这种时候不需要装载成 markdown 格式的链接
    // 因为纯文本更容易阅读
    const textInHref = href.includes(text)
    if(!textInHref) {
      v.text = `[${text}](${href})`
    }

    marks.splice(index, 1)
    if(marks.length < 1) delete v.marks
  }

  return newList
}