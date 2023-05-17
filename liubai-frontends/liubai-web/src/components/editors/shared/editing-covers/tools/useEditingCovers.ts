import { toRef, ref, inject } from "vue";
import { useLiuWatch } from "~/hooks/useLiuWatch";
import time from "~/utils/basic/time";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"
import type { ImageShow } from '~/types';
import cui from "~/components/custom-ui";
import { mainViewWidthKey, viceViewWidthKey } from "~/utils/provide-keys"
import { getViewTranNames } from "~/utils/other/transition-related";
import liuApi from "~/utils/liu-api";
import type { EditingCoversProps } from "./types"

export function useEditingCovers(props: EditingCoversProps) {

  const imgWidth = props.isInComment ? 100 : 140
  const globalStore = useGlobalStateStore()
  const modelValue = toRef(props, "modelValue")
  const sortList = ref<ImageShow[]>([])
  const viewTranNames = getViewTranNames(sortList)

  let lastTwoTriggerList: number[] = []
  const whenPropChange = () => {
    
    if(isItFrequently(lastTwoTriggerList)) {
      console.warn("useEditingCovers whenPropChange 太频繁触发了!!!!!!!")
      return
    }

    const tmpList = modelValue.value
    if(!tmpList || tmpList.length < 1) {
      sortList.value = []
      return
    }
    sortList.value = tmpList
  }
  useLiuWatch(modelValue, whenPropChange, true)


  const { axis } = initAxis(props, imgWidth)

  const onDragStart = () => {
    globalStore.isDragToSort = true
  }
  
  const onDragEnd = () => {
    globalStore.isDragToSort = false
  }

  const onTapImage = async (index: number) => {
    const covers = props.modelValue
    if(!covers || !covers[index]) return

    const vt = liuApi.canIUse.viewTransitionApi()
    if(vt) {
      viewTranNames.value[index] = "preview-image"
    }
    let closingIdx = index

    await cui.previewImage({
      imgs: covers,
      index,
      viewTransition: vt,
      viewTransitionCallbackWhileShowing() {
        if(vt) viewTranNames.value[index] = ""
      },
      viewTransitionCallbackWhileClosing(idx: number) {
        closingIdx = idx
        if(vt) viewTranNames.value[closingIdx] = "preview-image"
      },
      viewTransitionBorderRadius: "10px",
    })
    if(vt) viewTranNames.value[closingIdx] = ""
  }

  return {
    imgWidth,
    axis,
    sortList,
    viewTranNames,
    onDragStart,
    onDragEnd,
    onTapImage,
  }
}

function initAxis(
  props: EditingCoversProps,
  imgWidth: number
) {
  const { located } = props
  const breakpoint = (imgWidth * 2) + 100    // 计算断点，如果宽度大于(图片的两倍 + 100)
                                             // 就代表两张图片可以横的显示，需要 x 轴
  
  const axis = ref<"xy" | "y">("xy")
  if(located === "main-view" || located === "vice-view") {
    const key = located === "main-view" ? mainViewWidthKey : viceViewWidthKey
    const w = inject(key)
    if(w) {
      const _getAxis = () => {
        const newV = w.value
        if(newV > breakpoint) axis.value = "xy"
        else axis.value = "y"
      }
      useLiuWatch(w, _getAxis)
    }
  }

  return { axis }
}



function isItFrequently(
  lastTwoTriggerList: number[]
) {
  const now = time.getTime()
  if(lastTwoTriggerList.length > 1) {
    const prev1 = lastTwoTriggerList[1]
    const prev2 = lastTwoTriggerList[0]
    const diff1 = now - prev1
    const diff2 = now - prev2
    if(diff1 < 300 && diff2 < 500) return true
  }
  lastTwoTriggerList.push(now)
  if(lastTwoTriggerList.length > 2) {
    lastTwoTriggerList.splice(0, 1)
  }
  return false
}