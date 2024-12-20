import { VueNodeViewRenderer } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Blockquote from "@tiptap/extension-blockquote"
import HardBreak from "@tiptap/extension-hard-break"
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import Code from '@tiptap/extension-code'
import Link from '@tiptap/extension-link'
import Heading from '@tiptap/extension-heading'
import { wrappingInputRule, nodeInputRule, Extension } from "@tiptap/core"
import type { TipTapEditor } from "~/types/types-editor"
import type { EditorCoreProps, EditorCoreEmits } from "./types"
import { linkToTextPlugin } from "../link-to-text/link-to-text"
import CodeBlockComponent from '../code-block-component/code-block-component.vue'
import { createVirtualCursor } from 'prosemirror-virtual-cursor'
import { useI18n } from 'vue-i18n'
import { initLowlight } from '~/utils/other/lowlight-related'

export function initExtensions(
  props: EditorCoreProps,
  emits: EditorCoreEmits,
) {

  const { t } = useI18n()
  const bqRegex = /^[>》]\s$/

  const CustomCode = Code.extend({
    addKeyboardShortcuts() {
      return {
        // 在行内代码敲击 Enter，自动退出行内代码
        "Enter": ({ editor }) => {
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
          return false
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
      return VueNodeViewRenderer(CodeBlockComponent as any)
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

  const { lowlight } = initLowlight()
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

  if(!props.isEdit) {
    const CustomLink = Link.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          customAttr: {
            default: null,
            renderHTML: (attrs) => {
              return {
                "class": "liu-link",
                "data-link": attrs.href,
              }
            }
          }
        }
      }
    })
  
    const CustomHeading = Heading.configure({
      levels: [1],
    })

    extensions.push(CustomLink)
    extensions.push(CustomHeading)
  }
  else {
    
    // 在编辑态时，才加载 virtualCursor 插件
    const virtualCursorPlugin = createVirtualCursor()
    const CustomEdit = Extension.create({
      name: "custom-edit",
      addProseMirrorPlugins() {
        return [
          virtualCursorPlugin,
          linkToTextPlugin,
        ]
      }
    })

    extensions.push(CustomEdit)
  }

  return extensions
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