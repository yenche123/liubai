import { storeToRefs } from "pinia";
import { computed, inject } from "vue";
import { useLayoutStore } from "~/views/useLayoutStore";
import cui from "~/components/custom-ui";
import type { CetEmit, CetProps } from "./types";
import { svBottomUpKey, svScollingKey } from "~/utils/provide-keys";
import valTool from "~/utils/basic/val-tool";

export function useCeToolbar(props: CetProps, emit: CetEmit) {
  const svBottomUp = inject(svBottomUpKey)
  const scrollPosition = inject(svScollingKey)

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
    const res = await cui.showHashtagSelector({ tags: props.tagShows })
    if(!res.confirm) return
    if(!res.tags) return
    emit("newhashtags", res.tags)

    // 去聚焦
    const editor = props.editor
    if(!editor) return
    editor.commands.focus()
  }

  const onTapMore = () => {
    emit("tapmore")
  }

  // 当点击 "扩展/收起" 时，去判断是否滚动
  const checkAndScrollToTop = async () => {
    if(!svBottomUp) return
    if(!scrollPosition) return
    const sT = scrollPosition.value
    if(sT < 50) return

    // 去滚动
    svBottomUp.value = { type: "pixel", pixel: 0 }

    // 计算滚动时长
    let milli = sT - 100
    if(milli < 150) milli = 150
    else if(milli > 450) milli = 450
    await valTool.waitMilli(milli)
  }

  const onTapExpand = async () => {

    // 先判断要不要滚动
    await checkAndScrollToTop()

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