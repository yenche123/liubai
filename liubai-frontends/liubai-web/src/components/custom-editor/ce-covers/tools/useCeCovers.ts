import { toRef, ref } from "vue";
import { useLiuWatch } from "~/hooks/useLiuWatch";
import { useGlobalStateStore } from "../../../../hooks/stores/useGlobalStateStore"
import type { ImageShow } from '../../../../types';
import cui from "../../../custom-ui";

interface CeCoversProps {
  modelValue?: ImageShow[]
}

export const ceCoversProps = {
  modelValue: Array<ImageShow>
}

export function useCeCovers(props: CeCoversProps) {

  const globalStore = useGlobalStateStore()
  const modelValue = toRef(props, "modelValue")
  const sortList = ref<ImageShow[]>([])
  const whenPropChange = () => {
    const tmpList = modelValue.value
    console.log(tmpList)
    if(!tmpList || tmpList.length < 1) {
      sortList.value = []
      return
    }
    sortList.value = tmpList
  }
  useLiuWatch(modelValue, whenPropChange, true)

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
    sortList,
    onDragStart,
    onDragEnd,
    onTapImage,
  }
}