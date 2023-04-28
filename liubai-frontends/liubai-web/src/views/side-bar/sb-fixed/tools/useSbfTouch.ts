import { SimpleFunc } from "~/utils/basic/type-tool"
import { SbfData } from "./types"
import { useWindowSize } from "~/hooks/useVueUse"
import valTool from "~/utils/basic/val-tool"
import time from "~/utils/basic/time"


export function useSbfTouch(
  sbfData: SbfData,
  toOpen: SimpleFunc,
  toClose: SimpleFunc,
) {

  let startX = 0
  let lastX = 0
  let startStamp = 0

  const { width } = useWindowSize()

  const onTouchStart = (e: TouchEvent) => {
    if(sbfData.state !== "opened") return
    const aTouch = e.touches[0]
    if(!aTouch) return

    // 如果触碰到右侧的蒙层，则阻止浏览器默认事件，这样可以避免在手机上前往后一页
    const target = e.target as HTMLElement
    if(target?.className === "sf-bg") {
      e.preventDefault()
    }

    startX = aTouch.clientX
    lastX = startX
    startStamp = time.getTime()
  }
  
  const onTouchMove = (e: TouchEvent) => {
    if(!startX) return
    const aTouch = e.touches[0]
    if(!aTouch) return
    lastX = aTouch.clientX

    if(lastX > startX) {
      startX = lastX
      return
    }

    const w = width.value
    let diffPixel = startX - lastX
    if(diffPixel > w) diffPixel = w
    diffPixel = valTool.numToFix(diffPixel, 2)

    // 先设置 透明度
    let opacity = 1 - (diffPixel / w)
    opacity = valTool.numToFix(opacity, 4)
    if(opacity < 0.0001) opacity = 0
    else if(opacity > 0.9999) opacity = 1
    sbfData.bgOpacity = opacity

    // 再设置距离
    if(diffPixel < 0.5) {
      sbfData.distance = '0'
    }
    else {
      sbfData.distance = `-${diffPixel}px`
    }
  }

  const _reset = () => {
    startX = 0
    lastX = 0
  }
  
  const onTouchEnd = (e: TouchEvent) => {
    if(!startX) return
    const now = time.getTime()
    const diffStamp = now - startStamp
    if(diffStamp < 250 && Math.abs(startX - lastX) < 10) {
      _reset()
      return
    }

    const aTouch = e.touches[0]
    if(aTouch?.clientX) {
      lastX = aTouch.clientX
    }
    
    const w = width.value
    let diffPixel = startX - lastX
    let percentage = diffPixel / w

    if(diffPixel < 10) {
      toOpen()
    }
    else if(diffPixel >= 120) {
      toClose()
    }
    else if(percentage <= 0.25) {
      toOpen()
    }
    else {
      toClose()
    }
    _reset()

  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
  }
}

