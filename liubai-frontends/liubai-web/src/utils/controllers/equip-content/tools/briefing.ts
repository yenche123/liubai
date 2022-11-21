
import type { LiuContent } from "../../../../types/types-atom";
import type { TipTapJSONContent } from "../../../../types/types-editor";
import { listToText } from "../../../transfer-util/text";


const MAGIC_NUM = 140


export function getBriefing(
  liuDesc?: LiuContent[]
): TipTapJSONContent | undefined {
  if(!liuDesc || liuDesc.length < 1) return
  let newLiuDesc = JSON.parse(JSON.stringify(liuDesc)) as LiuContent[]

  let requiredBrief = false
  const len = newLiuDesc.length

  // 行数大于 5 行
  if(len > 3) requiredBrief = true

  // 查找文字很多的情况
  let charNum = 0
  if(!requiredBrief) {
    for(let i=0; i<len; i++) {
      const v = newLiuDesc[i]
      const { type, content } = v
      if(content && content.length) charNum += listToText(content).length
      if(charNum > MAGIC_NUM) {
        if(type !== "codeBlock") requiredBrief = true
        if(i < (len - 1)) requiredBrief = true
      }
      if(requiredBrief) break
    }
  }

  if(!requiredBrief) return

  // 开始计算 briefing
  const briefing: LiuContent[] = []
  let prevCharNum = 0
  charNum = 0
  for(let i=0; i<len; i++) {
    const v = newLiuDesc[i]
    const { content } = v
    if(content && content.length) charNum += listToText(content).length
    if(charNum > MAGIC_NUM) {
      const newNode = _getBreakPoint(v, i + 1, prevCharNum)
      briefing.push(newNode)
      break
    }
    
    if(i === 2 && i < (len - 1)) {
      // 如果已经是第三行了，并且后面还有行数
      briefing.push(_addPoint3x(v))
      break
    }

    prevCharNum = charNum
    briefing.push(v)
  }
  
  return { type: "doc", content: briefing }
}

// 在该节点的尾巴添加 ...
function _addPoint3x(node: LiuContent) {
  const newNode = JSON.parse(JSON.stringify(node)) as LiuContent
  let { type, content } = newNode
  if(type === "paragraph" && content) {
    content.push({ type: "text", text: "..." })
    newNode.content = content
  }
  else if(type === "blockquote" && content?.length) {
    const lastChild = content[content.length - 1]
    content[content.length - 1] = _addPoint3x(lastChild)
  }

  return newNode
}

/**
 * 当临界 MAGIC_NUM 发生在该节点内时，执行该函数
 * @param node 当前节点信息
 * @param row 当前行数
 * @param prevCharNum 未包含当前节点时，已有的文字数
 */
function _getBreakPoint(
  node: LiuContent, 
  row: number, 
  prevCharNum: number
) {
  const { type, content } = node
  if(!content) return node
  let newNode = JSON.parse(JSON.stringify(node)) as LiuContent

  if(type === "blockquote") {
    newNode.content = _handleBlockQuote(content, row, prevCharNum)
  }
  else if(type === "bulletList" || type === "orderedList") {
    newNode.content = _handleList(content, row, prevCharNum)
  }
  else if(type === "paragraph") {
    const tmp = _handleParagraph(content, prevCharNum)
    newNode.content = tmp.content
  }

  return newNode
}

// 返回 blockquote 所需的 content
function _handleBlockQuote(
  paragraphs: LiuContent[], 
  row: number, 
  prevCharNum: number
) {
  let charNum = prevCharNum
  const newParagraphs: LiuContent[] = []

  for(let i=0; i<paragraphs.length; i++) {
    const v = paragraphs[i]
    const { type, content } = v
    if(type !== "paragraph" || !content?.length) {
      newParagraphs.push(v)
      continue
    }
    row += 1

    let tmp = _handleParagraph(content, charNum)
    charNum = tmp.charNum
    v.content = tmp.content

    newParagraphs.push(v)
    
    // 已经发生断点了
    if(tmp.hasMagic) {
      break
    }

    // 当前已在第三行
    if(row >= 3) {
      break
    }
  }

  return newParagraphs
}

// 返回 有序列表或无序列表 所需的 content
function _handleList(
  items: LiuContent[], 
  row: number, 
  prevCharNum: number
) {

  let charNum = prevCharNum
  const newItems: LiuContent[] = []

  for(let i=0; i<items.length; i++) {
    const v = items[i]
    const { type, content } = v

    if(type !== "listItem" || !content?.length) {
      newItems.push(v)
      continue
    }

    let firNode = content[0]
    // 理想情况下: type2 === 'paragraph'
    const { type: type2, content: content2 } = firNode
    if(type2 !== "paragraph" || !content2?.length) {
      newItems.push(v)
      continue
    }

    row += 1

    let tmp = _handleParagraph(content2, charNum)
    charNum = tmp.charNum
    content[0].content = tmp.content

    newItems.push(v)
    
    // 已经发生断点了
    if(tmp.hasMagic) {
      break
    }

    // 当前已在第三行
    if(row >= 3) {
      break
    }
  }

  return newItems
}

/**
 * 如果字符数超过 MAGIC_NUM 自动截断，并返回特定类型
 * @param textList 由 { type: 'text', text: '文本' } 所组成的数组
 * @param prevCharNum 当前已有的文字数
 * @returns 
 */
function _handleParagraph(
  textList: LiuContent[],
  prevCharNum: number
) {
  const newTextList: LiuContent[] = []
  let hasMagic = false
  let charNum = prevCharNum

  for(let i=0; i<textList.length; i++) {
    const v = textList[i]
    const { type, text } = v
    if(type !== "text" || !text) {
      newTextList.push(v)
      continue
    }

    let tmpNum = charNum + text.length
    if(tmpNum <= MAGIC_NUM) {
      charNum = tmpNum
      newTextList.push(v)
      continue
    }

    let diff = MAGIC_NUM - charNum
    v.text = text.substring(0, diff) + "..."
    newTextList.push(v)
    hasMagic = true
    break
  }

  return { content: newTextList, hasMagic, charNum }
}