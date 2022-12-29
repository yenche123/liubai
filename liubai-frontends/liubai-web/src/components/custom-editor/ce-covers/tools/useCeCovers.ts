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
    onDragStart,
    onDragEnd,
    onTapImage,
  }
}