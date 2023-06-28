import { shallowRef, ref, onMounted } from "vue"
import type { TipTapEditor } from "~/types/types-editor"
import EditorCore from "~/components/editors/editor-core/editor-core.vue"

export function useCcBox() {
  
  const editor = shallowRef<TipTapEditor>()
  const editorCoreRef = ref<typeof EditorCore | null>(null)

  onMounted(() => {
    if(!editorCoreRef.value) return
    editor.value = editorCoreRef.value.editor as TipTapEditor
  })

  return {
    editor,
    editorCoreRef,
  }
}