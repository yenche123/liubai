
import type { LiuContent } from "../../../../types/types-atom";
import type { TipTapJSONContent } from "../../../../types/types-editor";
import { listToText, getRowNum } from "../../../transfer-util/text";


const MAGIC_NUM = 140
const MAX_ROW = 3

/**
 * 当字数大于 140 行数大于 3 时，显示摘要
 * @param liuDesc 用户填写的完整内容
 * @returns 摘要
 */
export function getBriefing(
  liuDesc?: LiuContent[]
): TipTapJSONContent | undefined {
  if(!liuDesc || liuDesc.length < 1) return
  let newLiuDesc = JSON.parse(JSON.stringify(liuDesc)) as LiuContent[]

  let requiredBrief = false
  const len = newLiuDesc.length

  // 行数大于 3 行
  if(len > MAX_ROW) requiredBrief = true

  // 查找文字很多的情况
  // 为什么不直接把 newLiuDesc 带入 listToText() 去计算字符呢？因为要考虑代码块的情况
  // 可能卡片的前半段全是代码，很容易就超过 MAGIC_NUM 和 特定的行数
  let charNum = 0
  let rowNum = 0
  if(!requiredBrief) {
    for(let i=0; i<len; i++) {
      const v = newLiuDesc[i]
      const { type, content } = v
      if(content && content.length) {
        let tmpText = listToText(content)
        charNum += tmpText.length
        let tmpRow = getRowNum([v])
        rowNum += tmpRow
      }
      if(charNum > MAGIC_NUM) {
        if(type !== "codeBlock") requiredBrief = true
        if(i < (len - 1)) requiredBrief = true
      }
      if(rowNum > MAX_ROW) {
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
  let prevRowNum = 0
  charNum = 0
  rowNum = 0
  for(let i=0; i<len; i++) {
    const v = newLiuDesc[i]
    const { content } = v
    if(content && content.length) {
      let tmpText = listToText(content)
      charNum += tmpText.length
      let tmpRow = getRowNum([v])
      rowNum += tmpRow
    }
    if(charNum > MAGIC_NUM || rowNum > MAX_ROW) {
      const newNode = _getBreakPoint(v, prevRowNum, prevCharNum)
      briefing.push(newNode)
      break
    }
    
    if(i === 2 && i < (len - 1)) {
      // 如果已经是第三行了，并且后面还有行数
      briefing.push(_addPoint3x(v))
      break
    }

    prevCharNum = charNum
    prevRowNum = rowNum
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
 * @param prevRowNum 未包含当前节点时，已有的行数
 * @param prevCharNum 未包含当前节点时，已有的文字数
 */
function _getBreakPoint(
  node: LiuContent, 
  prevRowNum: number, 
  prevCharNum: number
) {
  const { type, content } = node
  if(!content) return node
  let newNode = JSON.parse(JSON.stringify(node)) as LiuContent

  if(type === "blockquote") {
    newNode.content = _handleBlockQuote(content, prevRowNum, prevCharNum)
  }
  else if(type === "bulletList" || type === "orderedList" || type === "taskList") {
    newNode.content = _handleList(content, prevRowNum, prevCharNum)
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
  prevRowNum: number, 
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
    prevRowNum += 1

    let tmp = _handleParagraph(content, charNum)
    charNum = tmp.charNum
    v.content = tmp.content

    newParagraphs.push(v)
    
    // 已经发生断点了
    if(tmp.hasMagic) {
      break
    }

    // 当前已在第三行
    if(prevRowNum >= MAX_ROW) {
      break
    }
  }

  return newParagraphs
}

// 返回 有序列表或无序列表 所需的 content
function _handleList(
  items: LiuContent[], 
  prevRowNum: number, 
  prevCharNum: number
) {

  let charNum = prevCharNum
  const newItems: LiuContent[] = []

  for(let i=0; i<items.length; i++) {
    const v = items[i]
    const { type, content } = v

    if((type !== "listItem" && type !== "taskItem") || !content?.length) {
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

    prevRowNum += 1

    let tmp = _handleParagraph(content2, charNum)
    charNum = tmp.charNum
    content[0].content = tmp.content

    newItems.push(v)
    
    // 已经发生断点了
    if(tmp.hasMagic) {
      break
    }

    // 当前已在第三行
    if(prevRowNum >= MAX_ROW) {
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