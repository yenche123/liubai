import { toRef, ref, inject } from "vue";
import { useLiuWatch } from "~/hooks/useLiuWatch";
import time from "~/utils/basic/time";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"
import type { ImageShow } from '~/types';
import cui from "~/components/custom-ui";
import { mainViewWidthKey } from "~/utils/provide-keys"

interface EditingCoversProps {
  modelValue?: ImageShow[]
}

export const ceCoversProps = {
  modelValue: Array<ImageShow>
}

export function useEditingCovers(props: EditingCoversProps) {

  const globalStore = useGlobalStateStore()
  const modelValue = toRef(props, "modelValue")
  const sortList = ref<ImageShow[]>([])

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


  const axis = ref<"xy" | "y">("xy")
  const mv = inject(mainViewWidthKey)
  if(mv) {
    const _getAxis = () => {
      const newV = mv.value
      if(newV > 380) axis.value = "xy"
      else axis.value = "y"
    }
    useLiuWatch(mv, _getAxis)
  }

  const onDragStart = () => {
    globalStore.isDragToSort = true
  }
  
  const onDragEnd = () => {
    globalStore.isDragToSort = false
  }

  const onTapImage = (index: number) => {
    const covers = props.modelValue
    if(!covers || !covers[index]) return
    cui.previewImage({
      imgs: covers,
      index,
    })
  }

  return {
    axis,
    sortList,
    onDragStart,
    onDragEnd,
    onTapImage,
  }
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