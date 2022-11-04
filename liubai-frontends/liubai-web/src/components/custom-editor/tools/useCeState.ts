
import { reactive, ref, ShallowRef } from "vue";
import { TipTapEditor, EditorCoreContent } from "../../../types/types-editor";
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore";
import transfer from "../../../utils/transfer-util"

interface CeState {
  when: Date | null

}


export function useCeState(editor: ShallowRef<TipTapEditor>) {
  
  let state = reactive<CeState>({
    when: null,
  })

  const focused = ref(false)
  const gs = useGlobalStateStore()
  let timeout = 0

  let setFocus = (newV: boolean) => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      focused.value = newV
      gs.$patch({ mainInputing: newV })
    }, 100)
  }

  const onEditorFocus = (data: EditorCoreContent) => {
    setFocus(true)
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    setFocus(false)
  } 

  const onEditorFinish = (data: EditorCoreContent) => {
    console.log("onEditorFinish........")
    console.log(data)
    console.log(" ")
    const { type, content } = data.json
    transfer.tiptapToLiu(content ?? [])
  }

  const onWhenChange = (date: Date | null) => {
    state.when = date
  }

  

  return {
    focused,
    onEditorFocus,
    onEditorBlur,
    onEditorFinish,
    onWhenChange,
  }
}