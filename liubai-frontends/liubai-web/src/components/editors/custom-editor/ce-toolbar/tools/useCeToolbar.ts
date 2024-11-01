import { storeToRefs } from "pinia";
import { computed, inject } from "vue";
import { useLayoutStore } from "~/views/useLayoutStore";
import cui from "~/components/custom-ui";
import type { CetEmit, CetProps } from "./types";
import { svBottomUpKey, svScrollingKey } from "~/utils/provide-keys";
import valTool from "~/utils/basic/val-tool";
import { useFormatClear } from "../../../tools/useFormatClear"

export function useCeToolbar(props: CetProps, emit: CetEmit) {
  const svBottomUp = inject(svBottomUpKey)
  const scrollPosition = inject(svScrollingKey)

  const layout = useLayoutStore()
  const { sidebarStatus } = storeToRefs(layout)
  const expanded = computed(() => {
    if(sidebarStatus.value === "fullscreen") return true
    return false
  })

  const onTapTag = async () => {
    const res = await cui.showHashtagSelector({ tags: props.tagShows })
    if(!res.confirm) return
    if(!res.tags) return
    emit("newhashtags", res.tags)
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

  const {
    showFormatClear,
    onTapClearFormat
  } = useFormatClear(props)

  return { 
    expanded, 
    showFormatClear,
    onTapExpand,
    onTapTag,
    onTapMore,
    onTapClearFormat,
  }
}