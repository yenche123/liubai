import { nextTick, useTemplateRef } from "vue"
import { hideAllPoppers } from 'floating-vue'
import type { LiuMenuProps } from "./types"

export function useLiuMenu(props: LiuMenuProps) {

  const maskEl = useTemplateRef<HTMLElement>("maskEl")

  const _whenWheel = (ev: WheelEvent) => {
    // console.log("whenWheel ev: ")
    // console.log(ev)
    // console.log(" ")
    hideAllPoppers()
  }

  const connectMaskEl = async () => {
    if(!props.allowMask) return
    await nextTick()
    if(!maskEl.value) return
    maskEl.value.addEventListener("wheel", _whenWheel)
  }


  const disconnectMaskEl = () => {
    if(!props.allowMask) return
    if(!maskEl.value) return
    maskEl.value.removeEventListener("wheel", _whenWheel)
  }

  const onTouchEndMask = (e: TouchEvent) => {
    hideAllPoppers()
  }
  
  return {
    maskEl,
    connectMaskEl,
    disconnectMaskEl,
    onTouchEndMask
  }
}