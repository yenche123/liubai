
import { isProxy, watch, type WatchStopHandle } from "vue"
import cfg from "~/config"
import time from "~/utils/basic/time"
import type { KeyboardOpt } from "~/types/other/types-keyboard"

let _opt: KeyboardOpt | undefined
let _watchStop: WatchStopHandle | undefined
let lastInputTxtChangeStamp = 0

let oldInputTxt = ""
const _handleKeyDown = (e: KeyboardEvent) => {
  const opt = _opt
  if(!opt) return

  const d = opt.data

  if(opt.whenKeyUp && d) {
    const key = e.key
    if(key === "Enter") {

      // do not set oldInputTxt when inputTxt just changed within 1 frame
      const now = time.getLocalTime()
      const diff = now - lastInputTxtChangeStamp
      // console.log("diff", diff)
      if(diff > cfg.frame_duration_2) {
        oldInputTxt = d.inputTxt
      }
    }
  }
  
  if(d && typeof d.nativeInputTxt === "string") {
    if(d.nativeInputTxt !== d.inputTxt) {
      return
    }
  }

  opt.whenKeyDown?.(e)
}

let oldNativeTxt = ""
const _handleKeyUp = (e: KeyboardEvent) => {
  const opt = _opt
  if(!opt) return

  const d = opt.data
  const key = e.key

  if(d) {
    if(key === "Enter") {
      const newInputTxt = d.inputTxt
      // console.log("_handleKeyUp")
      // console.log("newInputTxt", newInputTxt)
      // console.log("oldInputTxt", oldInputTxt)
      if(newInputTxt !== oldInputTxt) {
        oldInputTxt = newInputTxt
        return
      }
    }
  }

  const newNativeTxt = d?.nativeInputTxt
  if(d && typeof newNativeTxt === "string") {
    if(newNativeTxt !== d.inputTxt) {
      oldNativeTxt = newNativeTxt
      return
    }

    if(key === "Escape") {
      if(newNativeTxt !== oldNativeTxt) {
        oldNativeTxt = newNativeTxt
        return
      }
    }

    oldNativeTxt = newNativeTxt
  }

  opt.whenKeyUp?.(e)
}

export function toListenKeyboard(
  opt: KeyboardOpt,
) {
  _opt = opt

  const d = opt.data
  
  if(d) {
    oldInputTxt = d.inputTxt
    oldNativeTxt = d.nativeInputTxt ?? ""

    if(isProxy(d)) {
      _watchStop = watch(() => d.inputTxt, (newV) => {
        lastInputTxtChangeStamp = time.getLocalTime()
      })
    }
  }
  
  if(_opt.whenKeyDown || d) {
    window.addEventListener("keydown", _handleKeyDown)
  }

  if(_opt.whenKeyUp) {
    window.addEventListener("keyup", _handleKeyUp)
  }
}

export function cancelListenKeyboard() {

  if(_opt?.whenKeyDown || _opt?.data) {
    window.removeEventListener("keydown", _handleKeyDown)
  }

  if(_opt?.whenKeyUp) {
    window.removeEventListener("keyup", _handleKeyUp)
  }

  if(_watchStop) {
    _watchStop()
  }

  _opt = undefined
}

