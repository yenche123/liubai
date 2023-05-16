import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useLayoutStore } from "~/views/useLayoutStore";
import cui from "~/components/custom-ui";
import type { CetEmit, CetProps } from "./types";

export function useCeToolbar(props: CetProps, emit: CetEmit) {
  const layout = useLayoutStore()
  const { sidebarStatus } = storeToRefs(layout)
  const expanded = computed(() => {
    if(sidebarStatus.value === "fullscreen") return true
    return false
  })
  const showFormatClear = computed(() => {
    const editor = props.editor
    if(!editor) return false
    const bold = editor.isActive("bold")
    const italic = editor.isActive("italic")
    const strike = editor.isActive("strike")
    return bold || italic || strike
  })

  const onTapTag = async () => {
    const res = await cui.showHashTagEditor({ mode: "search" })
    if(!res.confirm) return
    if(res.text) emit("addhashtag", res)
  }

  const onTapMore = () => {
    emit("tapmore")
  }

  const onTapExpand = () => {
    const newV = sidebarStatus.value === "fullscreen" ? "default" : "fullscreen"
    layout.$patch({ sidebarStatus: newV })
  }

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
    expanded, 
    showFormatClear,
    onTapExpand,
    onTapTag,
    onTapMore,
    onTapClearFormat,
  }
}