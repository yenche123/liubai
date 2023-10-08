import { onMounted, onUnmounted } from "vue";
import type { ShallowRef } from "vue";
import type { TipTapEditor } from "~/types/types-editor"
import type { EditorCoreProps, EditorCoreEmits } from "./types"
import cui from '~/components/custom-ui'
import time from "~/utils/basic/time";

// 监听 # 被点击
export function useEcHashtag(
  editorRef: ShallowRef<TipTapEditor | undefined>,
  props: EditorCoreProps, 
  emits: EditorCoreEmits,
) {

  let lastTriggerStamp = 0
  let lastProcessStamp = 0   // 注音鍵盤會出現 Process 這個 e.key
  let lastHashAndThreeStamp = 0
  let lastShiftStamp = 0

  const _canTriggerThenGetEditor = () => {
    const editor = editorRef.value
    if(!editor) return

    const isFocused = editor.isFocused
    if(!isFocused) return

    const isPara = editor.isActive("paragraph")
    if(!isPara) return

    const diff = time.getTime() - lastTriggerStamp
    if(diff < 500) return
    
    return editor
  }

  // 注音鍵盤 用 whenKeyDown 會監聽不到 # 事件
  // 故這裡使用 whenKeyUp 輔助判斷
  const whenKeyUp = (e: KeyboardEvent) => {
    if(!props.hashTrigger) return
    const editor = _canTriggerThenGetEditor()
    if(!editor) return

    const now = time.getTime()
    const key = e.key
    if(key === "Process") {
      lastProcessStamp = now
      return
    }
    else if(key === "3" || key === "#") {
      lastHashAndThreeStamp = now
    }
    else if(key === "Shift") {
      lastShiftStamp = now
    }
    else {
      return
    }
    const diff1 = Math.abs(lastShiftStamp - lastProcessStamp)
    const diff2 = Math.abs(lastHashAndThreeStamp - lastProcessStamp)
    if(diff1 < 250 && diff2 < 10) {
      lastTriggerStamp = time.getTime()
      triggerHashTagEditor(editor, emits)
    }
  }

  const whenKeyDown = (e: KeyboardEvent) => {
    if(!props.hashTrigger) return

    const key = e.key
    if(key !== "#") return

    const editor = _canTriggerThenGetEditor()
    if(!editor) return

    lastTriggerStamp = time.getTime()
    triggerHashTagEditor(editor, emits)
  }
  
  onMounted(() => {
    window.addEventListener("keydown", whenKeyDown)
    window.addEventListener("keyup", whenKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener("keydown", whenKeyDown)
    window.removeEventListener("keyup", whenKeyUp)
  })
}

async function triggerHashTagEditor(
  editor: TipTapEditor,
  emits: EditorCoreEmits,
) {
  const res = await cui.showHashtagEditor({ mode: "search" })
  if(!res.confirm) {
    editor.commands.focus()
    return
  }

  if(res.text) emits("addhashtag", res)

  // 查看是否要删掉 #
  const { state } = editor
  const { selection } = state
  const { $from, empty } = selection
  if(!empty) return
  editor.chain()
    .focus()
    .command(({ tr }) => {
      tr.delete($from.pos - 1, $from.pos)
      return true
    })
    .run()
}