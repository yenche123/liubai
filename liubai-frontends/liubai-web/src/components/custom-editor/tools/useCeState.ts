
import { ref, ShallowRef } from "vue";
import { TipTapEditor, EditorCoreContent } from "../../../types/types-editor";


export function useCeState(editor: ShallowRef<TipTapEditor>) {

  const focused = ref(false)

  const onEditorFocus = (data: EditorCoreContent) => {
    focused.value = true
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    focused.value = false
  } 


  const onEditorFinish = (data: EditorCoreContent) => {
    console.log("用户敲击了 ctrl + Enter")
    console.log(data)
    console.log(" ")
  }

  return {
    focused,
    onEditorFocus,
    onEditorBlur,
    onEditorFinish,
  }
}