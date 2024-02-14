
import type { KeyboardOpt } from "~/types/other/types-keyboard"

let _opt: KeyboardOpt | undefined

let oldInputTxt = ""
const _handleKeyDown = (e: KeyboardEvent) => {
  const opt = _opt
  if(!opt) return

  const d = opt.data

  if(opt.whenKeyUp && d) {
    const key = e.key
    if(key === "Enter") {
      oldInputTxt = d.inputTxt
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
      if(newInputTxt !== oldInputTxt) {
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
  
  if(opt.data) {
    oldInputTxt = opt.data.inputTxt
    oldNativeTxt = opt.data.nativeInputTxt ?? ""
  }
  
  if(_opt.whenKeyDown || _opt.data) {
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

  _opt = undefined
}

