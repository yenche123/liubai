import { inject, ref, toRef, watch, type Ref } from "vue"
import { useDebounceFn, useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"
import { useLayoutStore } from "~/views/useLayoutStore"
import { storeToRefs } from "pinia"
import type { CeData } from "./types"
import { deviceChaKey } from "~/utils/provide-keys"


export function useEditorHeight(
  ceData: CeData,
) {
  const maxEditorHeight = ref(500)
  const minEditorHeight = ref(cfg.min_editor_height)

  listenChange(maxEditorHeight, minEditorHeight, ceData)

  return {
    maxEditorHeight,
    minEditorHeight,
  }
}

function listenChange(
  maxEditorHeight: Ref<number>,
  minEditorHeight: Ref<number>,
  ceData: CeData,
) {
  const { height } = useWindowSize()
  const layout = useLayoutStore()
  const { sidebarStatus } = storeToRefs(layout)

  const cha = inject(deviceChaKey)

  const _getMaxHeight = () => {
    const winH = height.value
    let h = winH - 147
    if(ceData.showTitleBar) h -= 40
    if(ceData.tagIds.length) h -= 48
    if(ceData.images?.length) h -= 142
    if(cha?.isMobile) {
      h -= Math.round(winH / 15)
      if(sidebarStatus.value === "fullscreen") {
        h += cfg.navi_height
      }
    }

    return Math.max(h, 120)
  }

  const _calc = () => {
    let h = _getMaxHeight()
    maxEditorHeight.value = h
    if(sidebarStatus.value === "fullscreen") {
      minEditorHeight.value = h
    }
    else {
      minEditorHeight.value = cfg.min_editor_height
    }
  }

  const _delay = useDebounceFn(() => {
    _calc()
  }, 300)

  const s1 = toRef(ceData, "showTitleBar")
  const s2 = toRef(ceData, "tagIds")
  const s3 = toRef(ceData, "images")

  watch([sidebarStatus, height, s1, s2, s3], (
    [newV1], [oldV1]
  ) => {
    if(newV1 !== oldV1) {
      _calc()
    }
    else {
      _delay()
    }
  }, { deep: true })
}