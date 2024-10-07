import { computed, ref, useTemplateRef, type CSSProperties } from "vue";
import type { LiuImgEmits, LiuImgProps, LiuImgStyles } from "./types";
import liuUtil from "~/utils/liu-util";
import valTool from "~/utils/basic/val-tool";

export function useLiuImg(
  props: LiuImgProps,
  emits: LiuImgEmits,
) {

  const TRANSITION_MS = 300

  const imgEl = useTemplateRef<HTMLImageElement>("imgEl")

  const imgStyles = computed<CSSProperties>(() => {
    const baseStyles: LiuImgStyles = {
      objectFit: props.objectFit,
      transition: TRANSITION_MS + "ms",
      userSelect: props.userSelect ? 'auto' : 'none',
      borderRadius: props.borderRadius ? props.borderRadius : '0',
      viewTransitionName: props.viewTransitionName,
    }
    return baseStyles as CSSProperties
  })

  const canvasWH = computed(() => {
    const w = props.width
    const h = props.height
    if(!w || !h) return null
    const widthHeight = liuUtil.constraintWidthHeight(w, h, 128, 128)
    return widthHeight
  })

  const show = ref(false)
  const closeCanvas = ref(false)
  const bgOpacity = computed(() => {
    if (show.value) return 0
    return 1
  })

  const onImgLoaded = async () => {
    if(props.disableTransition) return
    if(show.value) return
    show.value = true
  
    const _img = imgEl.value
    if(!_img) return
    const naturalHeight = _img.naturalHeight
    const naturalWidth = _img.naturalWidth
    emits("load", { naturalWidth, naturalHeight })
  
    if(closeCanvas.value) return
    if(!props.blurhash || !canvasWH.value) return
  
    await valTool.waitMilli(TRANSITION_MS)
    closeCanvas.value = true
  }

  return {
    TRANSITION_MS,
    imgEl,
    imgStyles,
    canvasWH,
    show,
    closeCanvas,
    bgOpacity,
    onImgLoaded,
  }

}