import { onMounted, ref, shallowRef } from 'vue';
import type { ThreadShow } from '../../../../../types/types-content';
import EditorCore from "../../../../editor-core/editor-core.vue"
import type { TipTapEditor } from "../../../../../types/types-editor"

interface TcProps {
  threadData: ThreadShow
  displayType: "list" | "detail"
}


export function useThreadCard(props: TcProps) {
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = shallowRef<TipTapEditor>()

  onMounted(() => {
    if(!editorCoreRef.value) return
    editor.value = editorCoreRef.value.editor as TipTapEditor
  })

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
    editorCoreRef,
    editor,
    isBriefing,
    onTapBriefing,
  }
}

