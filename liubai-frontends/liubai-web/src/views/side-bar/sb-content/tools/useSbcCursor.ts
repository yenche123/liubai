import { reactive } from "vue"
import type { LiuTimeout } from "~/utils/basic/type-tool"
import valTool from "~/utils/basic/val-tool"
import type { ScTopItemKey, SbcCursorInfo } from "./types"

export function useSbcCursor() {

  let closeCursorStamp: LiuTimeout
  const cursorInfo = reactive<SbcCursorInfo>({
    enable: false,
    show: false,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  })

  const _showCursor = async (
    baseRect: DOMRect,
    rect: DOMRect,
  ) => {
    if(closeCursorStamp) {
      clearTimeout(closeCursorStamp)
      closeCursorStamp = undefined
    }

    cursorInfo.width = rect.width
    cursorInfo.height = rect.height
    cursorInfo.x = rect.x - baseRect.x
    cursorInfo.y = rect.y - baseRect.y

    if(!cursorInfo.enable) {
      cursorInfo.enable = true
      await valTool.waitMilli(16)
    }
    if(!cursorInfo.show) {
      if(!closeCursorStamp) cursorInfo.show = true
    }
  }

  const _closeCursor = () => {
    cursorInfo.show = false
  }

  const _calculateRect = (q: string) => {
    const baseEl = document.querySelector(".sb-virtual-first")
    if(!baseEl) {
      console.warn("查无 .sb-virtual-first 元素")
      return
    }
    const childEl = document.querySelector(q)
    if(!childEl) {
      console.warn(`查无 ${q} 元素`)
      return
    }
    const baseRect = baseEl.getBoundingClientRect()
    const childRect = childEl.getBoundingClientRect()
    _showCursor(baseRect, childRect)
  }

  const onScTopMouseEnter = (key: ScTopItemKey) => {
    const q = `.sct-item.sct-item-${key}`
    _calculateRect(q)
  }

  const onMouseEnter = (key: string) => {
    const q = `.sb-link-box.sb-link-${key}`
    _calculateRect(q)
  }

  const onMouseLeave = () => {
    closeCursorStamp = setTimeout(() => {
      closeCursorStamp = undefined
      _closeCursor()
    }, 250)
  }


  return {
    cursorInfo,
    onScTopMouseEnter,
    onMouseEnter,
    onMouseLeave,
  }
}