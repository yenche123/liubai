import { onBeforeUnmount, onBeforeMount } from "vue"
import type { KeyboardOpt } from "~/types/other/types-keyboard"

export function useKeyboard(opt: KeyboardOpt) {

  let oldInputTxt = ""
  const _handleKeyDown = (e: KeyboardEvent) => {
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


  const _register = () => {
    if(opt.whenKeyDown || opt.data) {
      window.addEventListener("keydown", _handleKeyDown)
    }

    if(opt.whenKeyUp) {
      window.addEventListener("keyup", _handleKeyUp)
    }
  }

  const _unRegister = () => {
    if(opt.whenKeyDown || opt.data) {
      window.removeEventListener("keydown", _handleKeyDown)
    }

    if(opt.whenKeyUp) {
      window.removeEventListener("keyup", _handleKeyUp)
    }
  }

  const isSetup = opt.setup ?? true
  if(isSetup) {
    onBeforeMount(_register)
    onBeforeUnmount(_unRegister)
  }
  else {
    _register()
  }

  return {
    stop: _unRegister,
  }
}