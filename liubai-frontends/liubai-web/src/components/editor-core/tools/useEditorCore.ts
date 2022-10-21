import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'


export function useEditorCore() {

  const editor = useEditor({
    content: '<p>I’m running Tiptap with Vue.js. 🎉</p>',
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
    ],
  })

  return { editor }
  
}