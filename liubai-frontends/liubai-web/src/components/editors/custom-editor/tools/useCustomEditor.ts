import { onMounted, ref, shallowRef, type Ref } from "vue"
import EditorCore from "../../editor-core/editor-core.vue"
import type { TipTapEditor } from "~/types/types-editor"
import time from "~/utils/basic/time"
import type { LiuTimeout } from "~/utils/basic/type-tool"

export function useCustomEditor() {
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = shallowRef<TipTapEditor>()
  const showMask = ref(false)

  onMounted(() => {
    if(!editorCoreRef.value) return
    editor.value = editorCoreRef.value.editor as TipTapEditor
  })

  const onEditorScrolling = () => handleEditorScrolling(showMask)

  return {
    editorCoreRef, 
    editor,
    onEditorScrolling,
    showMask,
  }
}

let lastScoll = 0
let hideMaskTimeout: LiuTimeout
function handleEditorScrolling(
  showMask: Ref<boolean>,
) {
  if(time.isWithinMillis(lastScoll, 300)) return
  lastScoll = time.getTime()
  showMask.value = true
  if(hideMaskTimeout) clearTimeout(hideMaskTimeout)
  hideMaskTimeout = setTimeout(() => {
    hideMaskTimeout = undefined
    showMask.value = false
  }, 1500)
}
