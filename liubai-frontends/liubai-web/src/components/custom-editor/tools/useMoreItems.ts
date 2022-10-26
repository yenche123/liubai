import { computed, ref } from "vue";
import { EditorCoreContent } from "../../../types/types-editor";

interface CustomEditorProps {
  lastBar: boolean
}

export function useMoreItems(props: CustomEditorProps) {
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

  const showVirtualBar = computed(() => {
    if(props.lastBar) return true
    if(moreRef.value) return true
    return false
  })


  return { moreRef, onTapMore, canSubmitRef, onEditorUpdate, showVirtualBar }
}