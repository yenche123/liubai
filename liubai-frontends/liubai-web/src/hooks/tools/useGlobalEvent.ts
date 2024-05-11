// 在启动 app 时，触发一次
// 用于监听全局事件，主要是全局键盘事件处理
// 目前只有阻止用户 Tab 的用途，避免页面中的链接被聚焦，出现很丑的样式
import { useGlobalStateStore } from "../stores/useGlobalStateStore"
import { useKeyboard } from "../useKeyboard"

export function useGlobalEvent() {
  const gs = useGlobalStateStore()

  const whenKeyDown = (e: KeyboardEvent) => {
    const key = e.key

    // 判断是否为 Tab，若是的话再判断是否可监听键盘
    // 若皆为是的话，阻止原生事件 "点击 Tab 聚焦到按钮或链接"
    if(key === "Tab") {
      if(gs.canListenKeyboard) {
        e.preventDefault()
      }
    }
  }

  useKeyboard({ whenKeyDown })
}