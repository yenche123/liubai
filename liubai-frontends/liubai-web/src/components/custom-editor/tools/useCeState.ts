
import { ref, ShallowRef } from "vue";
import { TipTapEditor, EditorCoreContent } from "../../../types/types-editor";
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore";

export function useCeState(editor: ShallowRef<TipTapEditor>) {

  const focused = ref(false)
  const gs = useGlobalStateStore()
  let timeout = 0

  let setFocus = (newV: boolean) => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      focused.value = newV
      gs.$patch({ mainInputing: newV })
    }, 100)
  }

  const onEditorFocus = (data: EditorCoreContent) => {
    setFocus(true)
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    setFocus(false)
  } 

  const onEditorFinish = (data: EditorCoreContent) => {
    
  }

  return {
    focused,
    onEditorFocus,
    onEditorBlur,
    onEditorFinish,
  }
}