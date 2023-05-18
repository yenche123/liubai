import type { ToolBarProps } from "./types";
import { computed } from "vue";

export function useFormatClear(props: ToolBarProps) {

  // 是否显示 "清除样式" 的按钮
  const showFormatClear = computed(() => {
    const editor = props.editor
    if(!editor) return false
    const bold = editor.isActive("bold")
    const italic = editor.isActive("italic")
    const strike = editor.isActive("strike")
    return bold || italic || strike
  })

  // 点击清除样式
  const onTapClearFormat = () => {
    if(!showFormatClear.value) return
    const editor = props.editor
    if(!editor) return
    try {
      editor.chain().focus().unsetBold().unsetItalic().unsetStrike().run()
    }
    catch(err) {
      console.warn("清除样式发生错误........")
      console.log(err)
      console.log(" ")
    }
  }
  
  return {
    showFormatClear,
    onTapClearFormat,
  }
}