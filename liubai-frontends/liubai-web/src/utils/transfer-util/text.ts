import type { TipTapJSONContent } from "~/types/types-editor";
import type { LiuNodeType, LiuMarkAtom, LiuMarks } from "~/types/types-atom"

/**
 * 将 TipTapJSONContent 格式的数组，转换成纯文本
 * @param list 当前要转换成文本的 TipTapJSONContent[]
 * @param plainText 已转换完毕的文本
 * @param moreText 是否开启更多文字的模式，比如遇到链接，把链接也加载进来。默认为 false，表示关闭
 */
export function listToText(
  list: TipTapJSONContent[],
  plainText: string = "",
  moreText?: boolean,
  parentType?: string,
): string {

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { type, content, text, marks } = v
    if(text) {
      plainText += text
      if(moreText) {
        plainText = _addLinkToPlainText(plainText, marks as LiuMarks)
      }
      continue
    }

    if(type === "listItem") {
      if(parentType === "orderedList") {
        plainText += `${i + 1}. `
      }
      else if(parentType === "bulletList") {
        plainText += " · "
      }
    }

    if(content) {
      plainText = listToText(content, plainText, moreText, type)
      if(type === "codeBlock") plainText += "\n"
    }

    let addes: LiuNodeType[] = [
      "heading",
      "paragraph", 
      "bulletList",
      "orderedList", 
      "taskList",
      "blockquote", 
      "codeBlock",
      "horizontalRule",
      "listItem",
    ]
    if(type && addes.includes(type as LiuNodeType)) {
      plainText += "\n"
    }

  }

  return plainText
}

function _addLinkToPlainText(
  plainText: string,
  marks?: LiuMarkAtom[],
) {
  const firMark = marks?.[0]
  if(!firMark) return plainText
  if(firMark.type !== "link") return plainText
  const href = firMark.attrs?.href
  if(href) {
    plainText += ` ${href} `
  }
  return plainText
}


// 是检测到 type === "codeBlock" 或 "paragraph" 来增加行数的
export function getRowNum(
  list: TipTapJSONContent[],
  rowNum: number = 0,
) {

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { type, content } = v
    if(!type) continue

    if(type !== "codeBlock" && content?.length) {
      const tmpNum = getRowNum(content)
      rowNum += tmpNum
    }

    if(type === "codeBlock" && content?.length) {
      // 由一个 text 所组成
      const firContent = content[0]
      const codeText = firContent.text ?? ""
      const codeList = codeText.split("\n")
      rowNum += codeList.length
    }

    if(type === "paragraph") rowNum += 1
  }

  return rowNum
}