import { computed, type Ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import time from "~/utils/basic/time"
import liuApi from "~/utils/liu-api";
import sideBar from "~/views/side-bar";
import type { MainViewEmits } from "./types";

// 用于处理 mobile 设备，屏幕左侧可以从左至右滑动打开侧边栏的功能
export function useMvTouchBox(leftPx: Ref<number>, emits: MainViewEmits) {
  const { width } = useWindowSize()
  const { isPC } = liuApi.getCharacteristic()
  
  const showTouchBox = computed(() => {
    if(isPC) return false
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
    
    if(time.isWithinMillis(startStamp, time.SECONED)) {
      _toOpen()
    }
  }

  const onTouchEnd = () => {
    if(startX === null) return
    let diffPixel = lastX - startX
    let allowOpen = diffPixel >= (width.value / 10) && diffPixel > 40
    if(!allowOpen) {
      allowOpen = diffPixel > 80
    }

    let now = time.getTime()
    let diffStamp = now - startStamp

    // 滑动打开侧边栏的情况
    if(allowOpen && diffStamp < 1500) {
      _toOpen()
      return
    }

    // 是点击 main-view 的情况
    if(diffPixel < 10 && diffStamp < 200) {
      emits("tapmainview")
    }

    _reset()
  }

  
  return { 
    showTouchBox,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
  }
}