import { onMounted, ref, shallowRef, watch } from "vue"
import type { Ref } from "vue"
import { useWindowSize } from "../../../hooks/useVueUse"
import EditorCore from "../../editor-core/editor-core.vue"
import { TipTapEditor } from "../../../types/types-editor"

export function useCustomEditor() {
  const maxEditorHeight = ref(500)
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = shallowRef<TipTapEditor>()
  
  listenWindowChange(maxEditorHeight)

  onMounted(() => {
    if(!editorCoreRef.value) return
    editor.value = editorCoreRef.value.editor as TipTapEditor
    console.log("editor focus() ::::")
    console.log(editor.value.chain().focus().run())
    console.log(" ")
  })

  return { maxEditorHeight, editorCoreRef, editor }
}

function listenWindowChange(maxEditorHeight: Ref<number>) {
  let lastWinHeightChange = 0
  const { height } = useWindowSize()

  const whenWindowHeightChange = () => {
    let h = Math.max(height.value - 150, 100)
    maxEditorHeight.value = h
  }

  watch(height, () => {
    if(lastWinHeightChange) clearTimeout(lastWinHeightChange)
    lastWinHeightChange = setTimeout(() => {
      lastWinHeightChange = 0
      whenWindowHeightChange()
    }, 300)
  })

  whenWindowHeightChange()
}