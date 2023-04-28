import { computed } from "vue"
import { Ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import time from "~/utils/basic/time"
import sideBar from "~/views/side-bar";

// 用于处理 mobile 设备，屏幕左侧可以从左至右滑动打开侧边栏的功能
export function useMvTouchBox(leftPx: Ref<number>) {
  const { width } = useWindowSize()
  
  const showTouchBox = computed(() => {
    const left = leftPx.value
    if(left < 10) return true
    return false
  })

  let startX: number | null = null
  let lastX = 0
  let startStamp = 0

  const _reset = () => {
    startX = null
    lastX = 0
    startStamp = 0
  }

  const _toOpen = () => {
    _reset()
    sideBar.showFixedSideBar()
  }

  const onTouchStart = (e: TouchEvent) => {
    const aTouch = e.touches[0]
    if(!aTouch) return
    startX = aTouch.clientX
    lastX = startX
    startStamp = time.getTime()
  }

  const onTouchMove = (e: TouchEvent) => {
    if(startX === null) return
    const aTouch = e.touches[0]
    if(!aTouch) return
    lastX = aTouch.clientX

    let diffPixel = lastX - startX
    let allowOpen = diffPixel >= (width.value / 10) && diffPixel > 40
    if(!allowOpen) {
      allowOpen = diffPixel > 80
    }
    if(!allowOpen) return

    let now = time.getTime()
    let diffStamp = now - startStamp
    if(diffStamp < 1000) {
      _toOpen()
    }
  }

  const onTouchEnd = (e: TouchEvent) => {
    if(startX === null) return
    let diffPixel = lastX - startX
    let allowOpen = diffPixel >= (width.value / 10) && diffPixel > 40
    if(!allowOpen) {
      allowOpen = diffPixel > 80
    }

    if(!allowOpen) {
      _reset()
      return
    }

    let now = time.getTime()
    let diffStamp = now - startStamp
    if(diffStamp < 1500) {
      _toOpen()
    }
    else {
      _reset()
    }
  }

  
  return { 
    showTouchBox,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
  }
}