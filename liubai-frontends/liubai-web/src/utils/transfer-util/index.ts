import type { TipTapJSONContent } from "~/types/types-editor"
import type { LiuContent } from "~/types/types-atom"
import { trimJSONContent } from "./trim"
import { equipLink, depriveLink } from "./link"
import { filterNotLiuType } from "./filter"
import { listToText } from "./text"
import { listToMarkdown } from "./markdown"
import type { ListToMdOpt } from "./markdown"
import { LiuFileStore } from "~/types"
import valTool from "../basic/val-tool"

function tiptapToLiu(list: TipTapJSONContent[]): LiuContent[] {
  list = trimJSONContent(list)
  
  // console.log("list 1: ")
  // console.log(valTool.copyObject(list))
  list = equipLink(list)
  // console.log("list 2: ")
  // console.log(valTool.copyObject(list))

  // 开始过滤掉未定义的标签
  const newList = filterNotLiuType(list)
  return newList
}

function liuToTiptap(list: LiuContent[]) {
  const newList = depriveLink(list)
  return newList as TipTapJSONContent[]
}

function tiptapToText(
  list: TipTapJSONContent[],
  moreText?: boolean,
): string {
  return listToText(list, "", moreText)
}

function tiptapToMarkdown(
  list: LiuContent[],
  opt?: ListToMdOpt,
): string {
  return listToMarkdown(list, opt)
}

// 组装 Content 里的 search_other 字段
function packSearchOther(
  list: TipTapJSONContent[],
  files: LiuFileStore[],
) {
  let res = tiptapToText(list, true)
  for(let i=0; i<files.length; i++) {
    const f = files[i]
    res += ` ${f.name}`
  }
  res = res.trim().toLowerCase()
  return res
}


export default {
  tiptapToLiu,
  liuToTiptap,
  tiptapToText,
  tiptapToMarkdown,
  packSearchOther,
}




