import { TipTapJSONContent } from "../../types/types-editor";


export function listToText(
  list: TipTapJSONContent[],
  plainText: string = ""
): string {

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { type, content, text } = v
    if(text) {
      plainText += text
      continue
    }

    if(content) {
      plainText = listToText(content, plainText)
      if(type === "codeBlock") plainText += "\n"
    }

    let addes = [
      "paragraph", 
      "bulletList",
      "orderedList", 
      "taskList",
      "blockquote", 
      "codeBlock",
      "horizontalRule"
    ]
    if(type && addes.includes(type)) {
      plainText += "\n"
    }

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