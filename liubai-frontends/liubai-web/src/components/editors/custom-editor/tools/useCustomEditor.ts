import { onMounted, ref, shallowRef, watch, type Ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import EditorCore from "../../editor-core/editor-core.vue"
import type { TipTapEditor } from "~/types/types-editor"
import cfg from "~/config"
import { useLayoutStore } from "~/views/useLayoutStore"
import { storeToRefs } from "pinia"
import time from "~/utils/basic/time"
import type { LiuTimeout } from "~/utils/basic/type-tool"

export function useCustomEditor() {
  const maxEditorHeight = ref(500)
  const minEditorHeight = ref(cfg.min_editor_height)
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = shallowRef<TipTapEditor>()
  const showMask = ref(false)
  
  listenWindowChange(maxEditorHeight, minEditorHeight)

  onMounted(() => {
    if(!editorCoreRef.value) return
    editor.value = editorCoreRef.value.editor as TipTapEditor
  })

  const onEditorScrolling = () => handleEditorScrolling(showMask)

  return { 
    maxEditorHeight, 
    minEditorHeight,
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


function listenWindowChange(
  maxEditorHeight: Ref<number>,
  minEditorHeight: Ref<number>,
) {
  let lastWinHeightChange: LiuTimeout
  const { height } = useWindowSize()
  const layout = useLayoutStore()
  const { sidebarStatus } = storeToRefs(layout)

  const whenWindowHeightChange = () => {
    let h = Math.max(height.value - 147, 100)
    maxEditorHeight.value = h
    if(sidebarStatus.value === "fullscreen") {
      minEditorHeight.value = h
    }
  }

  const whenSidebarStatusChange = () => {
    if(sidebarStatus.value !== "fullscreen") {
      minEditorHeight.value = cfg.min_editor_height
      return
    }
    minEditorHeight.value = maxEditorHeight.value
  }

  watch(height, () => {
    if(lastWinHeightChange) clearTimeout(lastWinHeightChange)
    lastWinHeightChange = setTimeout(() => {
      lastWinHeightChange = undefined
      whenWindowHeightChange()
    }, 300)
  })

  watch(sidebarStatus, () => {
    whenSidebarStatusChange()
  })

  whenWindowHeightChange()
}