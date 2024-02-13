import { onBeforeUnmount, onBeforeMount } from "vue"

interface DataWithInputTxt {
  inputTxt: string
  [key: string]: any
}

interface KeyboardOpt {
  whenKeyDown?: (e: KeyboardEvent) => void
  whenKeyUp?: (e: KeyboardEvent) => void
  data?: DataWithInputTxt
}

export function useKeyboard(opt: KeyboardOpt) {

  let oldInputTxt = ""
  const _handleKeyDown = (e: KeyboardEvent) => {
    if(opt.whenKeyUp && opt.data) {
      const key = e.key
      if(key === "Enter") {
        oldInputTxt = opt.data.inputTxt
      }
    }
    opt.whenKeyDown?.(e)
  }

  const _handleKeyUp = (e: KeyboardEvent) => {
    if(opt.whenKeyDown && opt.data) {
      const key = e.key
      if(key === "Enter") {
        const newInputTxt = opt.data.inputTxt
        if(newInputTxt !== oldInputTxt) {
          return
        }
      }
    }
    opt.whenKeyUp?.(e)
  }


  onBeforeMount(() => {
    if(opt.whenKeyDown) {
      window.addEventListener("keydown", _handleKeyDown)
    }

    if(opt.whenKeyUp) {
      window.addEventListener("keyup", _handleKeyUp)
    }
  })

  onBeforeUnmount(() => {
    if(opt.whenKeyDown) {
      window.removeEventListener("keydown", _handleKeyDown)
    }

    if(opt.whenKeyUp) {
      window.removeEventListener("keyup", _handleKeyUp)
    }
  })
}