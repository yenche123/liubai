import { reactive } from "vue"
import { LiuTimeout } from "~/utils/basic/type-tool"
import valTool from "~/utils/basic/val-tool"


interface SbcCursorInfo {
  enable: boolean
  show: boolean
  width: number
  height: number
  y: number
}

export function useSbcCursor() {

  let closeCursorStamp: LiuTimeout
  const cursorInfo = reactive<SbcCursorInfo>({
    enable: false,
    show: false,
    width: 0,
    height: 0,
    y: 0,
  })

  const _showCursor = async (rect: DOMRect) => {
    if(closeCursorStamp) {
      clearTimeout(closeCursorStamp)
      closeCursorStamp = undefined
    }

    cursorInfo.width = rect.width
    cursorInfo.height = rect.height
    cursorInfo.y = rect.y

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

  const onMouseEnter = (key: string) => {
    const q = `.sb-link-box.sb-link-${key}`
    const el = document.querySelector(q)
    if(!el) return
    const rect = el.getBoundingClientRect()
    _showCursor(rect)
  }

  const onMouseLeave = () => {
    closeCursorStamp = setTimeout(() => {
      closeCursorStamp = undefined
      _closeCursor()
    }, 150)
  }


  return {
    cursorInfo,
    onMouseEnter,
    onMouseLeave,
  }
}