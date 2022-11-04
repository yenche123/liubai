import type { TipTapJSONContent } from "../../types/types-editor"
import type { LiuContent } from "../../types/types-atom"
import { trimJSONContent } from "./trim"
import { equipLink } from "./link"

const tiptapToLiu = (list: TipTapJSONContent[]) => {
  list = trimJSONContent(list)
  console.log("去添加链接.........")
  
  console.time("equit")
  list = equipLink(list)
  console.timeEnd("equit")

  console.log("姑且看一下被改造过后的 list: ")
  console.log(list)
  console.log(" ")
}

export default {
  tiptapToLiu,
}




