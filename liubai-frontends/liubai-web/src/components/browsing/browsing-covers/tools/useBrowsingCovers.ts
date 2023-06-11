import { toRef } from "vue"
import type { BrowsingCoversProps } from "./types"
import liuApi from "~/utils/liu-api"
import cui from "~/components/custom-ui"
import { getViewTranNames } from "~/utils/other/transition-related"

export function useBrowsingCovers(
  props: BrowsingCoversProps
) {
  const coversRef = toRef(props, "covers")
  const viewTranNames = getViewTranNames(coversRef)

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