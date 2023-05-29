import { onMounted, onUnmounted, watch } from "vue"
import type { SeKeyboardParam } from "./types"
import { handleKeyDown } from "./handle"
import liuUtil from "~/utils/liu-util"
import time from "~/utils/basic/time"
import liuApi from "~/utils/liu-api"
import { useRouteAndLiuRouter } from "~/routes/liu-router"

export function useSeKeyboard(param: SeKeyboardParam) {
  const {
    whenEsc,
    whenEnter,
    whenOpen,
    seData,
    tranMs,
    show
  } = param
  let lastEventTrigger = 0
  const cha = liuApi.getCharacteristic()
  const isMac = cha.isMac

  // 监听页面，查看是否处于允许搜索的页面
  let allowSearch = false
  const rr = useRouteAndLiuRouter()
  watch(rr.route, (newV) => {
    const inApp = newV.meta.inApp
    if(inApp === false) allowSearch = false
    else allowSearch = true
  })

  const _keydownDuringOpening = (e: KeyboardEvent) => {
    const key = e.key
    if(key !== "ArrowDown" && key !== "ArrowUp") return
    if(!liuUtil.canKeyUpDown()) return
  
    let diff: 1 | -1 = key === "ArrowDown" ? 1 : -1
    handleKeyDown(seData, diff, e)
  }

  const _keydownDuringClosing = (e: KeyboardEvent) => {
    const now = time.getTime()
    const diff = now - lastEventTrigger
    if(diff < tranMs) return

    const ctrlPressed = isMac ? e.metaKey : e.ctrlKey
    const shiftPressed = e.shiftKey
    const key = e.key.toLowerCase()

    if(ctrlPressed && !shiftPressed && (key === "p" || key === "k")) {
      e.preventDefault()
      console.log("ctrl + k/p 被触发...........")
      lastEventTrigger = now
      whenOpen({ type: "search" })
    }
  }

  const _whenKeyDown = (e: KeyboardEvent) => {
    if(!allowSearch) return
    if(show.value) _keydownDuringOpening(e)
    else _keydownDuringClosing(e)
  }
  
  const _whenKeyUp = (e: KeyboardEvent) => {
    if(!allowSearch) return
    if(!show.value) return
    
    const key = e.key
    if(key === "Escape") {
      whenEsc()
      return
    }
    if(key === "Enter") {
      whenEnter()
      return
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", _whenKeyDown)
    window.addEventListener("keyup", _whenKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener("keydown", _whenKeyDown)
    window.removeEventListener("keyup", _whenKeyUp)
  })
}


