
import { ref, ShallowRef } from "vue";
import { TipTapEditor, EditorCoreContent } from "../../../types/types-editor";
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore";

export function useCeState(editor: ShallowRef<TipTapEditor>) {

  const focused = ref(false)
  const gs = useGlobalStateStore()

  const onEditorFocus = (data: EditorCoreContent) => {
    focused.value = true
    gs.$patch({ mainInputing: true })
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    focused.value = false
    gs.$patch({ mainInputing: false })
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