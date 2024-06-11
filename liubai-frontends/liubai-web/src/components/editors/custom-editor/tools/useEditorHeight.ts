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
    let h = height.value - 147
    if(ceData.showTitleBar) h -= 40
    if(ceData.tagIds.length) h -= 48
    if(ceData.images?.length) h -= 140
    if(cha?.isMobile) h -= 40

    return Math.max(h, 100)
  }

  const _calc = () => {
    let h = _getMaxHeight()
    // console.log("h: ", h)
    maxEditorHeight.value = h
    if(sidebarStatus.value === "fullscreen") {
      minEditorHeight.value = h
    }
  }

  const whenSidebarStatusChange = () => {
    if(sidebarStatus.value !== "fullscreen") {
      minEditorHeight.value = cfg.min_editor_height
      return
    }
    minEditorHeight.value = maxEditorHeight.value
  }

  const _foo = useDebounceFn(() => {
    _calc()
  }, 300)

  const s1 = toRef(ceData, "showTitleBar")
  const s2 = toRef(ceData, "tagIds")
  const s3 = toRef(ceData, "images")
  watch([height, s1, s2, s3], _foo, { deep: true })

  watch(sidebarStatus, () => {
    whenSidebarStatusChange()
  }, { immediate: true })
}