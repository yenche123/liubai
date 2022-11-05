import type { TipTapJSONContent } from "../../types/types-editor"
import type { LiuContent } from "../../types/types-atom"
import { isLiuNodeType, isLiuMarkType } from "../../types/types-atom"
import { trimJSONContent } from "./trim"
import { equipLink } from "./link"

const tiptapToLiu = (list: TipTapJSONContent[]) => {
  list = trimJSONContent(list)
  console.log("去添加链接.........")
  
  console.time("equit")
  list = equipLink(list)
  console.timeEnd("equit")

  // 开始过滤掉未定义的标签
  const newList = filterNotLiuType(list)
  console.log("看一下 newList: ")
  console.log(newList)
  console.log(" ")
}

// 过滤掉不是 liu 的节点或 mark 类型
function filterNotLiuType(
  list: TipTapJSONContent[]
): LiuContent[] {
  if(!list || list.length < 1) return []
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    let { type, content, marks } = v
    if(!type || !isLiuNodeType(type)) {
      list.splice(i, 1)
      i--
      continue
    }

    if(marks?.length) {
      marks = marks.filter(v2 => v2.type && isLiuMarkType(v2.type))
    }

    if(content) {
      content = filterNotLiuType(content)
      if(!content.length) {
        delete v.content
      }
    }
  }

  return list as LiuContent[]
}


export default {
  tiptapToLiu,
}




