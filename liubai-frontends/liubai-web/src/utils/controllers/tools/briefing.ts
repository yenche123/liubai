
import type { LiuContent } from "~/types/types-atom";
import type { TipTapJSONContent } from "~/types/types-editor";
import type { PackThreadOpt } from "~/utils/show/tools/types";
import { listToText, getRowNum } from "~/utils/transfer-util/text";
import valTool from "~/utils/basic/val-tool";

const MAGIC_NUM = 66
const TOLERANT_NUM = 10
const MAX_ROW = 3
let _magicNum = MAGIC_NUM

function getMagicNum(opt: PackThreadOpt) {
  const { windowWidth, sStore } = opt
  const fontSize = sStore.local_font_size

  let width = windowWidth - 100
  if(width < 200) width = 200
  else if(width > 500) width = 500

  let size = fontSize === "L" ? 20 : 18

  let num = Math.floor(width / size) * 3

  if(num > 80) num = 80
  else if(num < 40) num = 40

  return num
}



/**
 * 当字数大于 MAGICNUM 或行数大于 3 时，显示摘要
 * @param liuDesc 用户填写的完整内容
 * @returns 摘要
 */
export function getBriefing(
  liuDesc: LiuContent[] | undefined,
  opt: PackThreadOpt,
): TipTapJSONContent | undefined {
  if(!liuDesc || liuDesc.length < 1) return
  let newLiuDesc = valTool.copyObject(liuDesc)
  const magicNum = getMagicNum(opt)
  _magicNum = magicNum

  let requiredBrief = false
  const len = newLiuDesc.length

  // 行数大于 3 行
  if(len > MAX_ROW) requiredBrief = true

  // 查找文字很多的情况
  // 为什么不直接把 newLiuDesc 带入 listToText() 去计算字符呢？因为要考虑代码块的情况
  // 可能卡片的前半段全是代码，很容易就超过 MAGICNUM 和 特定的行数
  let charNum = 0
  let rowNum = 0
  if(!requiredBrief) {
    for(let i=0; i<len; i++) {
      const v = newLiuDesc[i]
      const { type, content } = v
      const isCodeBlock = type === "codeBlock"
      if(content && content.length) {
        let tmpText = listToText(content)
        charNum += valTool.getTextCharNum(tmpText)
        let tmpRow = getRowNum([v])
        rowNum += tmpRow
      }
      if(charNum > (magicNum * 2 + TOLERANT_NUM * 2)) {
        if(!isCodeBlock) requiredBrief = true
        if(i < (len - 1)) requiredBrief = true
      }
      if(rowNum > MAX_ROW) {
        if(isCodeBlock) {
          if(rowNum > MAX_ROW + 1) {
            requiredBrief = true
          }
        }
        else {
          requiredBrief = true
        }

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
    if(content?.length) {
      let tmpText = listToText(content)
      charNum += valTool.getTextCharNum(tmpText)
      let tmpRow = getRowNum([v])
      rowNum += tmpRow
    }


    if(charNum > (magicNum * 2) || rowNum > MAX_ROW) {
      // 字数大于阈值 (magicNum * 2) 或者行数大于 MAX_ROW
      const newNode = _getBreakPoint(v, prevRowNum, prevCharNum)
      briefing.push(newNode)
      break
    }
    
    if(i === 2 && i < (len - 1)) {
      // 如果已经是第三行了，并且后面还有行数
      briefing.push(_addPoint3x(v))
      break
    }
    
    briefing.push(v)

    prevCharNum = charNum
    prevRowNum = rowNum

    if(rowNum >= 3 && i < (len - 1)) {
      break
    }

  }
  
  return { type: "doc", content: briefing }
}

// 在该节点的尾巴添加 ...
function _addPoint3x(node: LiuContent) {
  const newNode = valTool.copyObject(node)
  let { type, content } = newNode
  if(type === "paragraph" && content) {
    content.push({ type: "text", text: "......" })
    newNode.content = content
  }
  else if(type === "blockquote" && content?.length) {
    const lastChild = content[content.length - 1]
    content[content.length - 1] = _addPoint3x(lastChild)
  }

  return newNode
}

/**
 * 当临界 magicNum 发生在该节点内时，执行该函数
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
  let newNode = valTool.copyObject(node)

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
  else if(type === "codeBlock") {
    newNode.content = _handleCodeBlock(content, prevRowNum, prevCharNum)
  }

  return newNode
}

function _handleCodeBlock(
  items: LiuContent[],
  prevRowNum: number, 
  prevCharNum: number,
) {
  const v = items[0]
  const codeText = v?.text
  if(items.length !== 1 || !codeText) return items

  let leftRowNum = MAX_ROW - prevRowNum
  if(leftRowNum < 1) return items

  // ensure codeBlock has at least 2 lines
  if(leftRowNum === 1) leftRowNum = 2

  const tmpList = codeText.split("\n")
  if(tmpList.length <= leftRowNum) return items

  let text = ""
  for(let i=0; i<leftRowNum; i++) {
    const _txt = tmpList[i]
    text += _txt
    if(i < (leftRowNum - 1)) text += "\n"
  }

  const newV = { ...v, text }
  return [newV]
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



const POINTS = [
  "\n", ",", ".", "，", "。", 
  ";", "；", " ", "!", "?", 
  "！", "？", "-", "/", "%",
  ":", "：", "&", "=", "_"
]

/**
 * 如果字符数超过 magicNum 自动截断，并返回特定类型
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

    let tmpNum = charNum + valTool.getTextCharNum(text)
    let diff_0 = tmpNum - (_magicNum * 2)
    if(diff_0 <= 0) {
      charNum = tmpNum
      newTextList.push(v)
      continue
    }

    let diff_1 = (_magicNum * 2) - charNum

    // 希望不要断点在单词内，开始往前找合适的断点，最多查找 10 个字符
    let targetText = _getTargetText(text, diff_1)
    const tLength = targetText.length
    const startIdx = tLength - 1
    let endIdx = startIdx - 10
    if(endIdx < 3) endIdx = 3
    
    for(let j=startIdx; j>endIdx; j--) {
      const _char = targetText[j]
      if(POINTS.includes(_char)) {
        hasMagic = true
        targetText = targetText.substring(0, j) + "......"
        break
      }
    }
    if(!hasMagic) {
      hasMagic = true
      targetText += "......"
    }

    v.text = targetText

    newTextList.push(v)
    break
  }

  return { content: newTextList, hasMagic, charNum }
}

function _getTargetText(
  text: string,
  diff_1: number,
) {
  if(diff_1 < 20) return text.substring(0, 20)
  const textLength = text.length
  if(textLength < 10) return text
  
  let targetText = ""
  let charNum = 0
  for(let i=0; i<textLength; i++) {
    const _char = text[i]
    charNum += valTool.getTextCharNum(_char)
    targetText += _char
    if(charNum > diff_1) {
      break
    }
  }

  return targetText
}