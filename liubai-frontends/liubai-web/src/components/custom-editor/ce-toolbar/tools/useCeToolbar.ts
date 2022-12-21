import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useLayoutStore } from "../../../../views/useLayoutStore";
import cui from "../../../custom-ui";
import type { HashTagEditorRes } from "../../../../types/other/types-hashtag"

export const cetEmit = {
  imagechange: (files: File[]) => true,
  addhashtag: (res: HashTagEditorRes) => true,
  tapmore: () => true,
}

export interface CetEmit {
  (event: "imagechange", files: File[]): void
  (event: "addhashtag", res: HashTagEditorRes): void
  (event: "tapmore"): void
}

export function useCeToolbar(emit: CetEmit) {
  const layout = useLayoutStore()
  const { sidebarStatus } = storeToRefs(layout)
  const expanded = computed(() => {
    if(sidebarStatus.value === "fullscreen") return true
    return false
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

  return { 
    expanded, 
    onTapExpand,
    onTapTag,
    onTapMore,
  }
}