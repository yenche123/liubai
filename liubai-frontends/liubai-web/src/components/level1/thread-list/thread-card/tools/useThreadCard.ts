import { ref } from 'vue';
import type { ThreadShow } from '../../../../../types/types-content';


interface TcProps {
  threadData: ThreadShow
  displayType: "list" | "detail"
}


export function useThreadCard(props: TcProps) {
  const { threadData, displayType } = props
  let isBriefing = ref(Boolean(threadData.briefing))
  if(displayType === "detail") isBriefing.value = false

  const onTapBriefing = (e: MouseEvent) => {
    const { target, currentTarget } = e
    if(target) {
      const el = target as Element
      const tagName = el.tagName ?? ""
      if(tagName === "a" || tagName === "A") {
        return
      }
    }
    isBriefing.value = false
  }


  return {
    isBriefing,
    onTapBriefing,
  }
}

