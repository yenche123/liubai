import { reactive } from "vue";
import valTool from "~/utils/basic/val-tool";
import type { SbfData } from "./tools/types";
import type { LiuTimeout } from "~/utils/basic/type-tool";
import time from "~/utils/basic/time";
import cfg from "~/config"

const TRANSITION_DURATION = 300
const sbfData = reactive<SbfData>({
  state: "closed",
  enable: false,
  bgOpacity: 0,
  distance: "-110%",
  duration: "0",
})

export function initFixedSideBar() {
  return {
    TRANSITION_DURATION,
    sbfData,
    onTapPopup,
    onPopupTouchStart,
    onPopupTouchEnd,
    toOpen,
    toClose,
  }
}

export function showFixedSideBar() {
  toOpen()
}

export function closeFixedSideBar() {
  toClose()
}

function onTapPopup() {
  toClose()
}


let startStamp = 0
function onPopupTouchStart() {
  startStamp = time.getTime()
}

function onPopupTouchEnd() {
  if(time.isWithinMillis(startStamp, 200) && sbfData.state === "opened") {
    toClose()
  }
}


let openTimeout: LiuTimeout
let closeTimeout: LiuTimeout

function toOpen() {
  const s = sbfData.state
  if(s === "opening") return

  sbfData.state = "opening"
  if(closeTimeout) clearInterval(closeTimeout)

  const stamp1 = time.getLocalTime()

  // 第 3 步: 设置完全开启后的最终态
  const foo3 = (newDuration: number) => {
    sbfData.bgOpacity = 1
    sbfData.distance = "0"
    openTimeout = setTimeout(() => {
      sbfData.state = "opened"
      sbfData.duration = "0"

      // 再次重置，避免其他函数捣乱
      sbfData.bgOpacity = 1
      sbfData.distance = "0"
    }, newDuration + cfg.frame_duration)

    const stamp2 = time.getLocalTime()
    console.log("toOpen consumed: ", stamp2 - stamp1)
  }

  // 第 2 步: 判别过渡时长
  const foo2 = () => {
    let newDuration = TRANSITION_DURATION
    // 如果没有过度时间，把过度时间加上
    if(sbfData.duration === "0") {
      let percentage = 1 - sbfData.bgOpacity
      newDuration = valTool.numToFix(TRANSITION_DURATION * percentage, 0) + 90
      if(newDuration > TRANSITION_DURATION) {
        newDuration = TRANSITION_DURATION
      }
      // console.log("open newDuration: ", newDuration)
      sbfData.duration = `${newDuration}ms`
      openTimeout = setTimeout(() => {
        foo3(newDuration)
      }, cfg.frame_duration)
    }
    else {
      foo3(newDuration)
    }
  }

  // 第 1 步: 判别 enable
  const foo1 = () => {
    if(!sbfData.enable) {
      sbfData.enable = true
    }
    console.log("call foo2 directly")
    foo2()
  }

  foo1()  
}

function toClose() {
  const s = sbfData.state
  if(s === "closing") return

  sbfData.state = "closing"
  if(openTimeout) clearInterval(openTimeout)

  const foo2 = (newDuration: number) => {
    sbfData.bgOpacity = 0
    sbfData.distance = "-110%"

    // console.log("toClose newDuration: ", newDuration)

    closeTimeout = setTimeout(() => {
      sbfData.state = "closed"
      sbfData.duration = "0"
      sbfData.enable = false
      
      // 再次重置，避免其他函数捣乱
      sbfData.bgOpacity = 0
      sbfData.distance = "-110%"
    }, newDuration + cfg.frame_duration)
  }


  const foo1 = () => {
    let newDuration = TRANSITION_DURATION
    let percentage = sbfData.bgOpacity
    newDuration = valTool.numToFix(TRANSITION_DURATION * percentage, 0) + 90
    if(newDuration > TRANSITION_DURATION) {
      newDuration = TRANSITION_DURATION
    }
    sbfData.duration = `${newDuration}ms`
    closeTimeout = setTimeout(() => {
      foo2(newDuration)
    }, cfg.frame_duration)
  }

  foo1()
}
