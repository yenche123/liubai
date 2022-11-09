
import { reactive, ref, ShallowRef } from "vue";
import { TipTapEditor, EditorCoreContent } from "../../../types/types-editor";
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore";
import transfer from "../../../utils/transfer-util"
import type { LiuRemindMe } from "../../../types/types-atom";
import type { CeState } from "./types-ce"

export function useCeState(
  editor: ShallowRef<TipTapEditor>,
  state: CeState,
) {

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
  state.whenStamp = date ? date.getTime() : undefined
}

function toRemindMeChange(
  val: LiuRemindMe | null,
  state: CeState,
) {
  state.remindMe = val ? val : undefined
}

function toTitleChange(
  val: string,
  state: CeState,
) {
  state.title = val
}

function toSyncCloudChange(
  val: boolean,
  state: CeState,
) {
  state.storageState = val ? "CLOUD" : "LOCAL"
}