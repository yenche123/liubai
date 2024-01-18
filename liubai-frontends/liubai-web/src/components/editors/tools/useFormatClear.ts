import { computed } from "vue";
import type { TipTapEditor } from "~/types/types-editor"

interface FormatClearProps {
  editor?: TipTapEditor
  [key: string]: any
}

export function useFormatClear(props: FormatClearProps) {

  const showFormatClear = computed(() => {
    const editor = props.editor
    if(!editor) return false
    const bold = editor.isActive("bold")
    const italic = editor.isActive("italic")
    const strike = editor.isActive("strike")
    const code = editor.isActive("code")
    
    return bold || italic || strike || code
  })

  const onTapClearFormat = () => {
    if(!showFormatClear.value) return
    const editor = props.editor
    if(!editor) return

    // 1. 清除粗体、斜体、中划线
    try {
      editor.chain().focus().unsetBold().unsetItalic().unsetStrike().run()
    }
    catch(err) {
      console.warn("清除样式发生错误........")
      console.log(err)
      console.log(" ")
    }

    // 2. 判断是否清除 code
    const code = editor.isActive("code")
    if(!code) return
    const selection = editor.state.selection
    let chainCommand = editor.chain().unsetCode()

    // 3. 若当前没有选中文字，添加空白
    const empty = selection.empty
    if(empty) {
      chainCommand = chainCommand.insertContent(
        {
          type: "text",
          text: " ",
        },
        {
          parseOptions: {
            preserveWhitespace: "full",
          }
        }
      )
    }

    try {
      chainCommand.run()
    }
    catch(err) {
      console.warn("清除 code 发生错误........")
      console.log(err)
      console.log(" ")
    }
  }

  return {
    showFormatClear,
    onTapClearFormat,
  }
}