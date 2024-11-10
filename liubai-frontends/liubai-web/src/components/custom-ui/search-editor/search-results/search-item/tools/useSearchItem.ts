import { computed, inject } from "vue";
import type { SiProps } from "./types";
import { searchFuncsKey } from "../../../tools/types";
import { LiuTimeout } from "~/utils/basic/type-tool";
import liuApi from "~/utils/liu-api";

export function useSearchItem(props: SiProps) {

  const desc = computed(() => {
    const { siType, contentAtom } = props
    if(siType === 'suggest' || siType === 'results') {
      if(contentAtom?.desc) return contentAtom.desc
    }
    return ""
  })

  const injectData = inject(searchFuncsKey)
  const { isIOS } = liuApi.getCharacteristic()

  let timeoutForIOS: LiuTimeout
  const onMouseEnter = () => {
    if (!injectData) return
    // console.log("onMouseEnter: ", props.atomId)
    injectData.mouseenteritem(props.atomId)

    // to fix the bug that tap item is not triggered on ios
    if(!isIOS || props.siType !== "recent") return
    timeoutForIOS = setTimeout(() => {
      // console.warn("set timeout for ios")
      timeoutForIOS = undefined
      injectData.tapitem(props.siType, props.atomId)
    }, 250)
  }

  const onTapItem = () => {
    if (!injectData) return
    // console.log("onTapItem: ", props.siType, props.atomId)
    injectData.tapitem(props.siType, props.atomId)

    // to fix the bug that tap item is not triggered on ios
    if(!isIOS || props.siType !== "recent") return
    if(timeoutForIOS) {
      // console.warn("clear timeout for ios")
      clearTimeout(timeoutForIOS)
    }
  }

  const showClear = computed(() => {
    const { indicator, atomId, siType } = props
    if (indicator && indicator === atomId && siType === 'recent') return true
    return false
  })

  const onTapClear = () => {
    const { indicator, atomId } = props
    if(!indicator || indicator !== atomId) return
    if(!injectData) return
    injectData.clearitem(props.siType, props.atomId)
  }
  
  const isSelected = computed(() => {
    if(props.indicator && props.indicator === props.atomId) return true
    return false
  })

  return {
    desc,
    onMouseEnter,
    onTapItem,
    showClear,
    onTapClear,
    isSelected
  }
}