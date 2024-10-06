import { type Ref, toRef, ref, watch } from "vue"
import type { BrowsingCoversProps } from "./types"
import liuApi from "~/utils/liu-api"
import cui from "~/components/custom-ui"
import { getViewTranNames } from "~/utils/other/transition-related"
import { useDebounceFn, useWindowSize } from "~/hooks/useVueUse"

export function useBrowsingCovers(
  props: BrowsingCoversProps
) {
  const coversRef = toRef(props, "covers")
  const viewTranNames = getViewTranNames(coversRef)
  const isComment = props.purpose === 'comment'
  const imgWidth = ref(isComment ? 100 : 140)
  const paddingBlockStart = isComment ? 6 : 10

  initImgWidth(props, imgWidth)

  const onTapImage = (
    e: MouseEvent, 
    index: number,
    borderRadius: string,
  ) => {
    toTapImage(props, index, borderRadius, viewTranNames)
  }

  return {
    viewTranNames,
    onTapImage,
    imgWidth,
    paddingBlockStart,
  }
}

function initImgWidth(
  props: BrowsingCoversProps,
  imgWidth: Ref<number>,
) {
  const imgLayout = props.imgLayout
  const isOne = imgLayout?.one
  const isTwo = imgLayout?.two
  const len = props.covers?.length
  if(isOne || isTwo || !len) {
    return
  }

  const { width } = useWindowSize()

  const _calculate = () => {
    const w = width.value
    const p = props.purpose
    const isComment = p === 'comment'
    const offset = isComment ? 150 : 100
    let _imgWidth = Math.round((w - offset) / 4)

    if(isComment) {
      if(_imgWidth > 100) _imgWidth = 100
      else if(_imgWidth < 50) _imgWidth = 50
    }
    else {
      if(_imgWidth > 140) _imgWidth = 140
      else if(_imgWidth < 70) _imgWidth = 70
    }
    imgWidth.value = _imgWidth
  }

  const _debounce = useDebounceFn(_calculate, 300)

  let _init = false
  watch(width, (newV) => {
    if(!_init) {
      _init = true
      _calculate()
      return
    }
    _debounce()
  }, { immediate: true })
}

async function toTapImage(
  props: BrowsingCoversProps,
  index: number,
  borderRadius: string,
  viewTranNames: Ref<Array<string | undefined>>,
) {
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