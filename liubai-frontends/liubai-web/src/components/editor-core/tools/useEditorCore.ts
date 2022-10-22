import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useI18n, ComposerTranslation } from 'vue-i18n'

interface EditorCoreProps {
  titlePlaceholder: string
  descPlaceholder: string
}


export function useEditorCore(props: EditorCoreProps) {
  const { t } = useI18n()

  const extensions = initExtensions(props, t)
  const editor = useEditor({
    content: '',
    extensions,
  })

  return { editor }
}

export function initExtensions(props: EditorCoreProps, t: ComposerTranslation) {
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