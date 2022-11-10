
import { reactive, Ref, ref, ShallowRef, watch } from "vue";
import { TipTapEditor, EditorCoreContent, TipTapJSONContent } from "../../../types/types-editor";
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore";
import transfer from "../../../utils/transfer-util"
import type { LiuRemindMe } from "../../../types/types-atom";
import type { CeState } from "./types-ce"
import type { ImageShow } from "../../../types"

let editorContent: EditorCoreContent | null = null

export function useCeState(
  state: CeState,
  canSubmitRef: Ref<boolean>,
) {
  
  const focused = ref(false)
  const gs = useGlobalStateStore()
  let timeout = 0

  // 监听 covers 发生改变....
  watch(() => state.images, (newV) => {
    checkCanSubmit(state, canSubmitRef)
  })

  const _setFocus = (newV: boolean) => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      focused.value = newV
      gs.$patch({ mainInputing: newV })
    }, 100)
  }

  const onEditorFocus = (data: EditorCoreContent) => {
    editorContent = data
    _setFocus(true)
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    editorContent = data
    _setFocus(false)
  } 

  const onEditorUpdate = (data: EditorCoreContent) => {
    editorContent = data
    checkCanSubmit(state, canSubmitRef)
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
    onEditorUpdate,
    onEditorFinish,
    onWhenChange,
    onRemindMeChange,
    onTitleChange,
    onSyncCloudChange,
  }
}


function checkCanSubmit(
  state: CeState,
  canSubmitRef: Ref<boolean>,
) {
  let newCanSubmit = Boolean(state.images?.length) || Boolean(editorContent?.text.trim())
  canSubmitRef.value = newCanSubmit
}


function toWhenChange(
  date: Date | null,
  state: CeState,
) {
  state.whenStamp = date ? date.getTime() : undefined
  collectState(state, true)
}

function toRemindMeChange(
  val: LiuRemindMe | null,
  state: CeState,
) {
  state.remindMe = val ? val : undefined
  collectState(state, true)
}

function toTitleChange(
  val: string,
  state: CeState,
) {
  state.title = val
  collectState(state, true)
}

function toSyncCloudChange(
  val: boolean,
  state: CeState,
) {
  state.storageState = val ? "CLOUD" : "LOCAL"
  collectState(state, true)
}


/****************** 收集信息、缓存 ***************/
let collectTimeout = 0
function collectState(state: CeState, instant: boolean = false) {
  if(collectTimeout) clearTimeout(collectTimeout)
  if(instant) {
    toSave(state)
    return
  }
  collectTimeout = setTimeout(() => {
    toSave(state)
  }, 1000)
}

function toSave(state: CeState) {
  console.log("toSave.............")
  

}