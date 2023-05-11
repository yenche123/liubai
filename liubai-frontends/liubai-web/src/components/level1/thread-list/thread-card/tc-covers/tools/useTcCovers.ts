import { ref, watch } from "vue"
import type { TcCoversProps } from "./types"
import liuApi from "~/utils/liu-api"
import cui from "~/components/custom-ui"

export function useTcCovers(
  props: TcCoversProps
) {

  const viewTranNames = ref<Array<string | undefined>>([])
  watch(() => props.covers, (newV, oldV) => {
    const newLen = newV?.length ?? 0
    const oldLen = oldV?.length ?? 0
    if(newLen === oldLen) return

    const list: string[] = []
    for(let i=0; i<newLen; i++) {
      list.push("")
    }
    viewTranNames.value = list
  }, { immediate: true })

  const onTapImage = async (
    e: MouseEvent, 
    index: number,
    borderRadius: string,
  ) => {
    const c = props.covers
    if(!c || !c[index]) return

    const vt = liuApi.canIUse.viewTransitionApi()
    if(vt) {
      viewTranNames.value[index] = "preview-image"
    }

    let closingIdx = index

    await cui.previewImage({
      imgs: c,
      index,
      viewTransition: vt,
      viewTransitionCallbackWhileShowing() {
        if(vt) viewTranNames.value[index] = ""
      },
      viewTransitionCallbackWhileClosing(idx: number) {
        closingIdx = idx
        if(vt) viewTranNames.value[closingIdx] = "preview-image"
      },
      viewTransitionBorderRadius: borderRadius,
    })
    if(vt) viewTranNames.value[closingIdx] = ""
  }

  return {
    viewTranNames,
    onTapImage,
  }
}