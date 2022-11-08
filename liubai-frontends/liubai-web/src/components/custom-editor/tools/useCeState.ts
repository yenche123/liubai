
import { reactive, ref, ShallowRef } from "vue";
import { TipTapEditor, EditorCoreContent } from "../../../types/types-editor";
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore";
import transfer from "../../../utils/transfer-util"
import type { LiuRemindMe } from "../../../types/types-atom";

interface CeState {
  when: Date | null
  remindMe: LiuRemindMe | null
  title: string
  syncCloud: boolean
}


export function useCeState(editor: ShallowRef<TipTapEditor>) {
  
  let state = reactive<CeState>({
    when: null,
    remindMe: null,
    title: "",
    syncCloud: true
  })

  const focused = ref(false)
  const gs = useGlobalStateStore()
  let timeout = 0

  const _setFocus = (newV: boolean) => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      focused.value = newV
      gs.$patch({ mainInputing: newV })
    }, 100)
  }

  const onEditorFocus = (data: EditorCoreContent) => {
    _setFocus(true)
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    _setFocus(false)
  } 

  const onEditorFinish = (data: EditorCoreContent) => {
    console.log("onEditorFinish........")
    console.log(data)
    console.log(" ")
    const { type, content } = data.json
    transfer.tiptapToLiu(content ?? [])
  }

  const onWhenChange = (date: Date | null) => {
    toWhenChange(date, state)
  }

  const onRemindMeChange = (val: LiuRemindMe | null) => {
    toRemindMeChange(val, state)
  }

  const onTitleChange = (val: string) => {
    toTitleChange(val, state)
  }

  const onSyncCloudChange = (val: boolean) => {
    toSyncCloudChange(val, state)
  }
  
  return {
    focused,
    onEditorFocus,
    onEditorBlur,
    onEditorFinish,
    onWhenChange,
    onRemindMeChange,
    onTitleChange,
    onSyncCloudChange,
  }
}

function toWhenChange(
  date: Date | null,
  state: CeState,
) {
  console.log("接收到消息 whenChange..........")
  state.when = date
}

function toRemindMeChange(
  val: LiuRemindMe | null,
  state: CeState,
) {
  console.log("接收到 remindMe change.............")
  console.log(val)
  console.log(" ")
  state.remindMe = val

}

function toTitleChange(
  val: string,
  state: CeState,
) {
  console.log("接收到 title change.................")
  console.log(val)
  console.log(" ")
  state.title = val
}

function toSyncCloudChange(
  val: boolean,
  state: CeState,
) {
  console.log("接收到 syncCloud change.................")
  console.log(val)
  console.log(" ")
  state.syncCloud = val
}