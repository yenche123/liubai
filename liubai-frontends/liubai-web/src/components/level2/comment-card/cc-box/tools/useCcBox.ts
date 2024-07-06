import { shallowRef, ref, onMounted } from "vue"
import type { TipTapEditor } from "~/types/types-editor"
import EditorCore from "~/components/editors/editor-core/editor-core.vue"
import type { CcBoxProps } from "./types"
import { CloudFiler } from "~/utils/cloud/CloudFiler"

export function useCcBox(props: CcBoxProps) {
  
  const editor = shallowRef<TipTapEditor>()
  const editorCoreRef = ref<typeof EditorCore | null>(null)

  onMounted(() => {
    if(!editorCoreRef.value) return
    editor.value = editorCoreRef.value.editor as TipTapEditor
  })

  const afterTapFile = () => {
    const contentId = props.cs._id
    if(!contentId) return

    const files = props.cs.files
    if(!files) return

    const file = files[0]
    if(!file) return
    const { arrayBuffer, id: file_id } = file
    if(arrayBuffer) return

    CloudFiler.notify("contents", contentId, file_id)
  }

  return {
    editor,
    editorCoreRef,
    afterTapFile,
  }
}