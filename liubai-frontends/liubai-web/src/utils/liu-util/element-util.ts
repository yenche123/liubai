/** 存放一些跟操作 dom 相关的工具函数 */

/**
 * 检查 child 是否在 parent 的可视区域里
 * @param parent 父元素
 * @param child 子元素
 */
export function isChildElementVisible(parent: Element, child: Element) {
  const boxInfo = parent.getBoundingClientRect()
  const childInfo = child.getBoundingClientRect()
  const minY = boxInfo.y
  const maxY = minY + boxInfo.height
  const top = childInfo.top
  const bottom = top + childInfo.height
  // console.log("minY: ", minY)
  // console.log("maxY: ", maxY)
  // console.log("top: ", top)
  // console.log(" ")
  if(top < (minY - 1) || top >= (maxY - 5)) return false
  if(bottom >= (maxY + 10)) return false
  return true
}


interface MbstscOpt {
  offset?: number    // 显现出来到距离底部或上部的距离
}

interface MbstscRes {
  scrollRequired: boolean
  pixel?: number
}

/**
 * 计算父元素最佳滚动的目的地位置，让子元素完全显现出来
 * @param parent 
 * @param child 
 */
export function makeBoxScrollToShowChild(
  parent: Element, 
  child: Element,
  opt?: MbstscOpt
) {

  const boxInfo = parent.getBoundingClientRect()
  const childInfo = child.getBoundingClientRect()

  const minY = boxInfo.y
  const maxY = minY + boxInfo.height
  const top = childInfo.top
  const bottom = top + childInfo.height

  // 如果子元素的上部和底部都在可视范围内
  


}
