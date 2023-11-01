/** 存放一些跟操作 dom 相关的工具函数 */

interface MbstscOpt {
  offset?: number    // 显现出来到距离底部或上部的距离
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

  const sT = parent.scrollTop
  const minY = boxInfo.y
  const maxY = minY + boxInfo.height
  const top = childInfo.top
  const bottom = top + childInfo.height

  // console.log("minY: ", minY)
  // console.log("maxY: ", maxY)
  // console.log("top: ", top)
  // console.log("bottom: ", bottom)
  // console.log(" ")

  // 如果子元素的上部和底部都在可视范围内，则 return
  if(top >= minY && top <= maxY) {
    if(bottom <= maxY) return
  }

  const offset = opt?.offset ?? 7.5
  let pixel = (top - minY + sT) - offset
  if(pixel < 0) pixel = 0

  const sOpt: ScrollToOptions = {
    behavior: "smooth",
    top: pixel
  }
  parent.scrollTo(sOpt)
}

/** 计算指示器的左侧位置和宽度 */
export function getIndicatorLeftAndWidth(
  parentEl: Element, 
  childEl: Element,
) {
  const parentClient = parentEl.getBoundingClientRect()
  const childClient = childEl.getBoundingClientRect()

  if(!parentClient.width || !parentClient.height) return

  const left = childClient.left - parentClient.left
  const width = childClient.width

  return {
    left: `${left}px`,
    width: `${width}px`
  }
}
