// 存放一些自定义指令
// https://cn.vuejs.org/guide/reusability/custom-directives.html

import { type DirectiveBinding } from "vue"
import valTool from "../basic/val-tool"

const _toShow = async (el: HTMLElement, binding: DirectiveBinding) => {
  // 先空等 150ms 让其他组件先去隐藏
  await valTool.waitMilli(150)
  
  el.style.display = ""

  await valTool.waitMilli(16)

  el.style.visibility = "visible"
  el.style.opacity = "1"
}

const _toHide = async (el: HTMLElement, binding: DirectiveBinding) => {
  el.style.visibility = "hidden"
  el.style.opacity = "0"
  await valTool.waitMilli(150)
  el.style.display = "none"
}


/** 优化 v-show 指令，让 DOM 切换显示/隐藏时，能渐入渐出 */
const liuShowDirective = {

  created(el: HTMLElement, binding: DirectiveBinding) {
    const val = binding.value as Boolean
    
    // 初始化
    el.style.transitionDuration = "250ms"

    if(val) {
      el.style.visibility = "visible"
      el.style.opacity = "1"
    }
    else {
      el.style.visibility = "hidden"
      el.style.opacity = "0"
      el.style.display = "none"
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    const val = binding.value as Boolean
    if(val) _toShow(el, binding)
    else _toHide(el, binding)
  }
}

export {
  liuShowDirective,
}
