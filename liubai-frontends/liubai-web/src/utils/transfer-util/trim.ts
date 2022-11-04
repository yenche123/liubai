import type { TipTapJSONContent } from "../../types/types-editor"

export function trimJSONContent(list: TipTapJSONContent[]) {
  // 从前面开始 trim
  list = trimOneDirection(list, 1)
  // 从后面开始 trim
  list = trimOneDirection(list, -1)

  return list
}

function trimOneDirection(list: TipTapJSONContent[], direction: 1 | -1) {
  if(!list || list.length < 1) return []
  const initNum = direction > 0 ? 0 : (list.length - 1)

  for(let i=initNum; ; i += direction) {
    if(i < 0 || i >= list.length) break

    const v = list[i]
    let { type, content } = v

    // 先去掉最前和最后的分割线（因为没有意义）
    if(type === "horizontalRule") {
      list.splice(i, 1)
      if(direction > 0) i--
      continue
    }
    if(type !== "paragraph") break

    // 以下代码 已知当前节点是 paragraph 时
    content = trimTextContent({ content, direction })
    console.log(`dir: ${direction}, content: `)
    console.log(content)
    console.log(" ")
    if(!content) {
      list.splice(i, 1)
      if(direction > 0) i--
      continue
    }
    break
  }

  return list
}

/**
 * 处理 paragraph 节点下的 content
 */
function trimTextContent(
  opt: { content?: TipTapJSONContent[], direction: 1 | -1 }
) {
  let content = opt.content
  if(!content || content.length < 1) return undefined
  const dir = opt.direction
  const initNum = dir > 0 ? 0 : (content.length - 1)

  for(let i = initNum; ; i += dir) {
    if(i < 0 || i >= content.length) break

    const v = content[i]
    let { type, text } = v
    if(type !== "text") break
    v.text = text?.trim()
    if(!v.text) {
      content.splice(i, 1)
      if(dir > 0) i--
    }
    else {
      break
    }
  }

  if(content.length === 0) content = undefined
  return content
}