import { reactive } from "vue";
import valTool from "~/utils/basic/val-tool";
import type { SbfData } from "./tools/types";
import type { LiuTimeout } from "~/utils/basic/type-tool";

const TRANSITION_DURATION = 300
const sbfData = reactive<SbfData>({
  state: "closed",
  enable: false,
  bgOpacity: 0,
  distance: "-110%",
  duration: `${TRANSITION_DURATION}ms`,
})

export function initFixedSideBar() {
  return {
    TRANSITION_DURATION,
    sbfData,
    onTapPopup,
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


let openTimeout: LiuTimeout
let closeTimeout: LiuTimeout

function toOpen() {
  sbfData.state = "opening"
  if(closeTimeout) clearInterval(closeTimeout)

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
    }, newDuration + 16)
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
      }, 16)
    }
    else {
      foo3(newDuration)
    }
  }

  // 第 1 步: 判别 enable
  const foo1 = () => {
    if(!sbfData.enable) {
      sbfData.enable = true
      openTimeout = setTimeout(() => {
        foo2()
      }, 16)
    }
    else {
      foo2()
    }
  }

  foo1()  
}

function toClose() {
  sbfData.state = "closing"
  if(openTimeout) clearInterval(openTimeout)

  const foo2 = (newDuration: number) => {
    sbfData.bgOpacity = 0
    sbfData.distance = "-110%"

    // console.log("toClose newDuration: ", newDuration)

    closeTimeout = setTimeout(() => {
      sbfData.state = "closed"
      sbfData.duration = `${TRANSITION_DURATION}ms`
      sbfData.enable = false
      
      // 再次重置，避免其他函数捣乱
      sbfData.bgOpacity = 0
      sbfData.distance = "-110%"
    }, newDuration + 16)
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
    }, 16)
  }

  foo1()
}
