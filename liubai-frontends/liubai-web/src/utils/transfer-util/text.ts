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

    plainText += "\n"
  }

  return plainText
}