/** 存放一些跟操作 dom 相关的工具函数 */

// 检查 child 是否在 parent 的可视区域里
export function isChildElementVisible(parent: Element, child: Element) {
  const boxInfo = parent.getBoundingClientRect()
  const childInfo = child.getBoundingClientRect()
  const minY = boxInfo.y
  const maxY = minY + boxInfo.height
  const top = childInfo.top
  const top2 = top + childInfo.height
  // console.log("minY: ", minY)
  // console.log("maxY: ", maxY)
  // console.log("y: ", top)
  // console.log(" ")
  if(top < (minY - 1) || top >= (maxY - 5)) return false
  if(top2 >= (maxY + 10)) return false
  return true
}