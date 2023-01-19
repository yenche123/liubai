import type { LiuContent } from "../../../types/types-atom";
import type { FileLocal } from "~/types"
import { getBriefing } from "./briefing"
import { listToText } from "~/utils/transfer-util/text";

/**
 * 判断有没有 title，若有加到 content 里
 */
function packLiuDesc(
  liuDesc: LiuContent[] | undefined,
  title?: string,
) {
  if(!title) return liuDesc
  let newDesc = liuDesc ? JSON.parse(JSON.stringify(liuDesc)) as LiuContent[] : []
  const h1: LiuContent = {
    type: "heading",
    attrs: {
      level: 1,
    },
    content: [
      {
        "type": "text",
        "text": title
      }
    ]
  }
  newDesc.splice(0, 0, h1)
  return newDesc
}

/**
 * 生成 summary 字段，用于看板的卡片以及搜索结果的文字
 */
function getSummary(
  content: LiuContent[] | undefined,
  files: FileLocal[] | undefined,
) {
  let text = ""
  if(content && content.length > 0) {
    text = listToText(content)
    text = text.replace(/\n/g, " ")
    text = text.trim()
    if(text.length > 140) text = text.substring(0, 140)
    if(text) return text
  }

  if(files && files.length > 0) {
    text = files[0].name
    if(text.length > 140) text = text.substring(0, 140)
    return files[0].name
  }

  return text
}

export default {
  packLiuDesc,
  getBriefing,
  getSummary,
}