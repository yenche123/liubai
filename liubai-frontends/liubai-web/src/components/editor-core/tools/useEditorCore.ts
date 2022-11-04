import { useEditor, VueNodeViewRenderer } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Blockquote from "@tiptap/extension-blockquote"
import HardBreak from "@tiptap/extension-hard-break"
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import Code from '@tiptap/extension-code'
import { useI18n, ComposerTranslation } from 'vue-i18n'
import { wrappingInputRule, nodeInputRule } from "@tiptap/core"
import { TipTapEditor, TipTapJSONContent, EditorCoreContent } from "../../../types/types-editor"
import { onMounted } from 'vue'
import { lowlight } from 'lowlight'

import CodeBlockComponent from '../code-block-component/code-block-component.vue'

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

  const bqRegex = /^[>》]\s$/

  const CustomCode = Code.extend({
    addKeyboardShortcuts() {
      return {
        // 在行内代码敲击 Enter，自动退出行内代码
        "Enter": ({ editor }) => {
          console.log("Enter 被触发了........")
          console.log(" ")
          const isCode = editor.isActive("code")
          if(isCode) {
            return editor.chain()
            .toggleCode()
            .insertContent(" ")
            .run()
          }
          
          return false
        }
      }
    },
  })

  const CustomBlockQuote = Blockquote.extend({
    addKeyboardShortcuts() {
      return {}
    },
    addInputRules() {
      return [
        wrappingInputRule({
          find: bqRegex,
          type: this.type
        })
      ]
    },
    content: "paragraph*"
  })

  const CustomHardBreak = HardBreak.extend({
    addKeyboardShortcuts() {
      return {
        'Mod-Enter': ({ editor }) => {
          const isCodeBlock = editor.isActive("codeBlock")
          if(isCodeBlock) {
            return false
          }
          const isCode = editor.isActive("code")
          if(isCode) {
            return editor.chain()
              .toggleCode()
              .insertContent(" ")
              .run()
          }

          onModEnter(editor, emits)
          return editor.commands.blur()
        },
        'Escape': ({ editor }) => {
          const isCodeBlock = editor.isActive("codeBlock")
          if(isCodeBlock) false
          return editor.commands.blur()
        }
      }
    },
  })

  const CustomCodeBlockLowlight = CodeBlockLowlight.extend({
    addNodeView() {
      return VueNodeViewRenderer(CodeBlockComponent)
    }
  })

  const CustomHorizontalRule = HorizontalRule.extend({
    addInputRules() {
      return [
        nodeInputRule({
          find: /^(?:---\s)$/,
          type: this.type,
        })
      ]
    },
  })

  const extensions = [
    CustomCode,
    CustomBlockQuote,
    CustomCodeBlockLowlight.configure({
      lowlight
    }),
    CustomHardBreak,
    CustomHorizontalRule,
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
      codeBlock: false,
      code: false,
      horizontalRule: false,
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