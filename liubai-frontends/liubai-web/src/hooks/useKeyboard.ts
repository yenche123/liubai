import { onBeforeUnmount, onBeforeMount } from "vue"

interface KeyboardOpt {
  whenKeyDown?: (e: KeyboardEvent) => void
  whenKeyUp?: (e: KeyboardEvent) => void
}

export function useKeyboard(opt: KeyboardOpt) {

  onBeforeMount(() => {
    if(opt.whenKeyDown) {
      window.addEventListener("keydown", opt.whenKeyDown)
    }

    if(opt.whenKeyUp) {
      window.addEventListener("keyup", opt.whenKeyUp)
    }
  })

  onBeforeUnmount(() => {
    if(opt.whenKeyDown) {
      window.removeEventListener("keydown", opt.whenKeyDown)
    }

    if(opt.whenKeyUp) {
      window.removeEventListener("keyup", opt.whenKeyUp)
    }
  })
}