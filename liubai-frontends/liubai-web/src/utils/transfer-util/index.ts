import type { TipTapJSONContent } from "~/types/types-editor"
import type { LiuContent } from "~/types/types-atom"
import { trimJSONContent } from "./trim"
import { equipLink, depriveLink } from "./link"
import { filterNotLiuType } from "./filter"
import { listToText } from "./text"
import { listToMarkdown } from "./markdown"
import { imagesFromStoreToCloud, filesFromStoreToCloud } from "./file"
import type { ListToMdOpt } from "./markdown"
import type { LiuFileStore } from "~/types"


interface TiptapToLiuOpt {
  trim?: boolean     // true is default
}

function tiptapToLiu(
  list: TipTapJSONContent[],
  opt?: TiptapToLiuOpt,
): LiuContent[] {

  // 1. trim
  const trim = opt?.trim ?? true
  if(trim) {
    list = trimJSONContent(list)
  }
  
  // 2. handle links
  list = equipLink(list)
  
  // 3. filter unallowed types
  const newList = filterNotLiuType(list)
  return newList
}

function liuToTiptap(
  list: LiuContent[] | TipTapJSONContent[]
) {
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
  list: TipTapJSONContent[] | undefined,
  files: LiuFileStore[] | undefined,
) {
  let res = ""

  // 1. handle desc
  if(list) {
    res = tiptapToText(list, true)
  }

  // 2. handle files' names
  if(!files) files = []
  for(let i=0; i<files.length; i++) {
    const f = files[i]
    res += ` ${f.name}`
  }
  
  // 3. turn into lowercase
  res = res.trim().toLowerCase()
  return res
}


export default {
  tiptapToLiu,
  liuToTiptap,
  tiptapToText,
  tiptapToMarkdown,
  packSearchOther,
  imagesFromStoreToCloud,
  filesFromStoreToCloud,
}




