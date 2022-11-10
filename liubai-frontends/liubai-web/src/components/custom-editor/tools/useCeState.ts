
import { ref, watch, computed } from "vue";
import { EditorCoreContent, TipTapJSONContent } from "../../../types/types-editor";
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore";
import transfer from "../../../utils/transfer-util"
import type { LiuRemindMe } from "../../../types/types-atom";
import type { CeState } from "./types-ce"
import type { ComputedRef, Ref } from "vue";
import ider from "../../../utils/basic/ider";
import { DraftLocalTable } from "../../../types/types-table";
import { getLocalPreference } from "../../../utils/system/local-preference";
import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore";
import time from "../../../utils/basic/time";
import localReq from "./req/local-req"

let editorContent: EditorCoreContent | null = null
let space: ComputedRef<string>

export function useCeState(
  state: CeState,
  canSubmitRef: Ref<boolean>,
) {

  const spaceStore = useWorkspaceStore()  
  space = computed(() => {
    if(!spaceStore.isCollaborative) return "ME"
    return spaceStore.spaceId
  })
  
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
    collectState(state)
  }

  const onEditorFinish = (data: EditorCoreContent) => {
    editorContent = data
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

async function toSave(state: CeState) {
  console.log("toSave.............")
  
  const now = time.getTime()

  let insertedStamp = now
  if(state.draftId) {
    const tmp = await localReq.getDraftById(state.draftId)
    if(tmp) insertedStamp = tmp.insertedStamp
  }

  const draftId = state.draftId ?? ider.createDraftId()
  const { local_id: userId } = getLocalPreference()
  let liuDesc: TipTapJSONContent[] | undefined = undefined
  if(editorContent?.json) {
    const { type, content } = editorContent.json
    if(type === "doc" && content) liuDesc = content
  }

  const draft: DraftLocalTable = {
    _id: draftId,
    infoType: "THREAD",
    oState: "OK",
    user: userId as string,
    workspace: space.value,
    threadEdited: state.threadEdited,
    visScope: state.visScope,
    storageState: state.storageState,
    title: state.title,
    liuDesc,
    images: state.images,
    whenStamp: state.whenStamp,
    remindMe: state.remindMe,
    insertedStamp: insertedStamp,
    updatedStamp: now,
    editedStamp: now,
  }

  console.log("去本地存储 draft.........")
  console.log(draft)
  console.log(" ")

  const res = await localReq.setDraft(draft)
  if(!state.draftId && res) state.draftId = res as string
}