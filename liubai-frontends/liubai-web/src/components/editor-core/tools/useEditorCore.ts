import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useI18n, ComposerTranslation } from 'vue-i18n'
import { TipTapEditor, TipTapJSONContent } from "../../../types/types-editor"
import { onMounted } from 'vue'

export interface EditorCoreProps {
  titlePlaceholder: string
  descPlaceholder: string
  content?: TipTapJSONContent
}

export interface EditorCoreEmits {
  (event: "update", data: { html: string, text: string, json: TipTapJSONContent }): void
}

let lastEmpty: boolean
let lastText: string
let lastTriggetUpdate = 0    // update 事件防抖节流的标记


export function useEditorCore(props: EditorCoreProps, emits: EditorCoreEmits) {
  const { t } = useI18n()

  const extensions = initExtensions(props, t)
  const content = props?.content ?? "<p></p>"

  const editor = useEditor({
    content,
    extensions,
    onUpdate({ editor }) {
      onEditorUpdate(editor, t, props, emits)
    }
  })

  onMounted(() => {
    const eee = editor.value
    if(!eee) return
    lastEmpty = eee.isEmpty
    lastText = eee.getText()
  })

  return { editor }
}




function onEditorUpdate(
  editor: TipTapEditor, 
  t: ComposerTranslation,
  props: EditorCoreProps,
  emits: EditorCoreEmits
) {
  const html = editor.getHTML()
  const text = editor.getText()
  const json = editor.getJSON()
  const data = { html, text, json }
  const empty = editor.isEmpty
  if(lastTriggetUpdate) clearTimeout(lastTriggetUpdate)
  if(lastEmpty !== empty) {
    emits("update", data)
    lastEmpty = empty
    lastText = text
    return
  }
  if(!text && !lastText) {
    return
  }

  lastTriggetUpdate = setTimeout(() => {
    lastTriggetUpdate = 0
    emits("update", data)
    lastEmpty = empty
    lastText = text
  }, 150)
}


function initExtensions(props: EditorCoreProps, t: ComposerTranslation) {
  const extensions = [
    StarterKit.configure({
      heading: false,
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if(node.type.name === "heading") {
          return props.titlePlaceholder || t("common.title_ph")
        }
        const ph = props.descPlaceholder || t("common.desc_ph")
        return ph
      }
    })
  ]

  return extensions
}