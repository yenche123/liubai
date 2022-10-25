import { ref } from "vue";
import { EditorCoreContent } from "../../../types/types-editor";


export function useMoreItems() {
  const moreRef = ref(false)
  const canSubmitRef = ref(false)

  const onTapMore = () => {
    moreRef.value = !moreRef.value
  }

  const onEditorUpdate = (data: EditorCoreContent) => {
    const text = data.text.trim()
    if (text.length) canSubmitRef.value = true
    else canSubmitRef.value = false
  }


  return { moreRef, onTapMore, canSubmitRef, onEditorUpdate }
}