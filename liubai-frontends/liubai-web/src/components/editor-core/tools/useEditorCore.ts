import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Blockquote from "@tiptap/extension-blockquote"
import HardBreak from "@tiptap/extension-hard-break"
import { useI18n, ComposerTranslation } from 'vue-i18n'
import { TipTapEditor, TipTapJSONContent, EditorCoreContent } from "../../../types/types-editor"
import { onMounted } from 'vue'

export interface EditorCoreProps {
  titlePlaceholder: string
  descPlaceholder: string
  content?: TipTapJSONContent
}

export interface EditorCoreEmits {
  (event: "update", data: EditorCoreContent): void
  (event: "focus", data: EditorCoreContent): void
  (event: "blur", data: EditorCoreContent): void
  (event: "finish", data: EditorCoreContent): void
}

let lastEmpty: boolean
let lastText: string
let lastTriggetUpdate = 0    // update 事件防抖节流的标记


export function useEditorCore(props: EditorCoreProps, emits: EditorCoreEmits) {
  const { t } = useI18n()

  const extensions = initExtensions(props, emits, t)
  const content = props?.content ?? "<p></p>"

  const editor = useEditor({
    content,
    extensions,
    onUpdate({ editor }) {
      onEditorUpdate(editor, props, emits)
    },
    onFocus({ editor }) {
      onEditorFocus(editor, emits)
    },
    onBlur({ editor }) {
      onEditorBlur(editor, emits)
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

function onEditorFocus(
  editor: TipTapEditor,
  emits: EditorCoreEmits
) {
  const html = editor.getHTML()
  const text = editor.getText()
  const json = editor.getJSON()
  const data = { html, text, json }
  emits("focus", data)
}

function onEditorBlur(
  editor: TipTapEditor,
  emits: EditorCoreEmits
) {
  const html = editor.getHTML()
  const text = editor.getText()
  const json = editor.getJSON()
  const data = { html, text, json }
  emits("blur", data)
}

function onEditorUpdate(
  editor: TipTapEditor,
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

function onModEnter(
  editor: TipTapEditor,
  emits: EditorCoreEmits
) {
  const html = editor.getHTML()
  const text = editor.getText()
  const json = editor.getJSON()
  const data = { html, text, json }
  emits("finish", data)
}


function initExtensions(
  props: EditorCoreProps,
  emits: EditorCoreEmits,
  t: ComposerTranslation
) {

  const CustomBlockQuote = Blockquote.extend({
    addKeyboardShortcuts() {
      return {}
    },
    content: "paragraph*"
  })

  const CustomHardBreak = HardBreak.extend({
    addKeyboardShortcuts() {
      return {
        'Mod-Enter': () => {
          onModEnter(this.editor, emits)
          return this.editor.commands.blur()
        }
      }
    },
  })

  const extensions = [
    CustomBlockQuote,
    CustomHardBreak,
    TaskList.configure({
      HTMLAttributes: {
        class: "liu-tasklist"
      }
    }),
    TaskItem.configure({
      nested: false,
      HTMLAttributes: {
        class: "liu-taskitem"
      },
    }),
    StarterKit.configure({
      heading: false,
      bulletList: {
        HTMLAttributes: {
          class: "liu-bulletList"
        }
      },
      blockquote: false,
      hardBreak: false,
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