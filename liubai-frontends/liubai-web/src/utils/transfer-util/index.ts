import type { TipTapJSONContent } from "../../types/types-editor"
import type { LiuContent } from "../../types/types-atom"
import { trimJSONContent } from "./trim"
import { equipLink, depriveLink } from "./link"
import { filterNotLiuType } from "./filter"

function tiptapToLiu(list: TipTapJSONContent[]): LiuContent[] {
  list = trimJSONContent(list)
  
  console.time("equit")
  list = equipLink(list)
  console.timeEnd("equit")

  // 开始过滤掉未定义的标签
  const newList = filterNotLiuType(list)
  return newList
}

function liuToTiptap(list: LiuContent[]) {
  const newList = depriveLink(list)
  return newList as TipTapJSONContent[]
}

export default {
  tiptapToLiu,
  liuToTiptap,
}




