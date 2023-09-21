import { onMounted, onUnmounted } from "vue";
import type { ShallowRef } from "vue";
import type { TipTapEditor } from "~/types/types-editor"
import type { EditorCoreProps, EditorCoreEmits } from "./types"
import cui from '~/components/custom-ui'

// 监听 # 被点击
export function useEcHashtag(
  editorRef: ShallowRef<TipTapEditor | undefined>,
  props: EditorCoreProps, 
  emits: EditorCoreEmits,
) {

  const whenKeyDown = (e: KeyboardEvent) => {
    if(!props.hashTrigger) return

    const key = e.key
    if(key !== "#") return

    const editor = editorRef.value
    if(!editor) return

    const isFocused = editor.isFocused
    if(!isFocused) return

    const isPara = editor.isActive("paragraph")
    if(!isPara) return

    triggerHashTagEditor(editor, emits)
  }
  
  onMounted(() => {
    window.addEventListener("keydown", whenKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener("keydown", whenKeyDown)
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