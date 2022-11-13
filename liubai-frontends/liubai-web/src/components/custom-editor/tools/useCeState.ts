
import { ref, watch, computed, toRaw, isProxy, isReactive } from "vue";
import type { EditorCoreContent, TipTapJSONContent } from "../../../types/types-editor";
import { useGlobalStateStore } from "../../../hooks/stores/useGlobalStateStore";
import type { LiuRemindMe } from "../../../types/types-atom";
import type { CeState } from "./atom-ce"
import type { ComputedRef, Ref } from "vue";
import ider from "../../../utils/basic/ider";
import { DraftLocalTable } from "../../../types/types-table";
import { getLocalPreference } from "../../../utils/system/local-preference";
import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore";
import time from "../../../utils/basic/time";
import localReq from "./req/local-req";
import type { FileLocal, ImageLocal } from "../../../types";
import type { CepToPost } from "./useCePost"

let initStamp = 0
let space: ComputedRef<string>

export function useCeState(
  state: CeState,
  canSubmitRef: Ref<boolean>,
  toPost: CepToPost,
) {

  initStamp = time.getTime()

  const spaceStore = useWorkspaceStore()  
  space = computed(() => {
    if(!spaceStore.isCollaborative) return "ME"
    return spaceStore.spaceId
  })

  // 监听用户操作 images 的变化，去存储到 IndexedDB 上
  watch(() => state.images, (newV) => {
    toFilesChange(state)
    checkCanSubmit(state, canSubmitRef)
  }, { deep: true })

  // 监听用户操作 files 的变化，去存储到 IndexedDB 上
  watch(() => state.files, (newV) => {
    toFilesChange(state)
  }, { deep: true })
  
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
    state.editorContent = data
    _setFocus(true)
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    state.editorContent = data
    _setFocus(false)
  } 

  const onEditorUpdate = (data: EditorCoreContent) => {
    console.log("onEditorUpdate..............")
    state.editorContent = data
    checkCanSubmit(state, canSubmitRef)
    collectState(state)
  }

  const onEditorFinish = (data: EditorCoreContent) => {
    state.editorContent = data
    checkCanSubmit(state, canSubmitRef)

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

function _isRequiredChange() {
  const now = time.getTime()

  // 刚刚才 setup，拒绝缓存 images 或 files
  if(initStamp + 300 > now) {
    return false
  }
  return true
}

// 图片发生变化时，去保存
function toFilesChange(state: CeState) {
  if(_isRequiredChange()) collectState(state)
}


function checkCanSubmit(
  state: CeState,
  canSubmitRef: Ref<boolean>,
) {
  const imgLength = state.images?.length
  const text = state.editorContent?.text.trim()
  let newCanSubmit = Boolean(imgLength) || Boolean(text)
  canSubmitRef.value = newCanSubmit
}


function toWhenChange(
  date: Date | null,
  state: CeState,
) {
  state.whenStamp = date ? date.getTime() : undefined
  collectState(state)
}

function toRemindMeChange(
  val: LiuRemindMe | null,
  state: CeState,
) {
  state.remindMe = val ? val : undefined
  collectState(state)
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
  const now = time.getTime()

  let insertedStamp = now
  if(state.draftId) {
    const tmp = await localReq.getDraftById(state.draftId)
    if(tmp) insertedStamp = tmp.insertedStamp
  }

  const draftId = state.draftId ?? ider.createDraftId()
  const { local_id: userId } = getLocalPreference()
  let liuDesc: TipTapJSONContent[] | undefined = undefined
  if(state.editorContent?.json) {
    const { type, content } = state.editorContent.json
    if(type === "doc" && content) liuDesc = content
  }

  // 响应式对象 转为普通对象
  if(isProxy(liuDesc)) liuDesc = toRaw(liuDesc)
  let images = _getStoragedFiles(state)
  let files = _getStoragedFiles<FileLocal>(state, "files")
  let remindMe = isProxy(state.remindMe) ? toRaw(state.remindMe) : state.remindMe

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
    images,
    files,
    whenStamp: state.whenStamp,
    remindMe,
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


function _getStoragedFiles<T = ImageLocal>(
  state: CeState, 
  key: keyof CeState = "images"
): T[] | undefined {
  const files = state[key] as (T[] | undefined)
  if(!files) return

  const newList: T[] = []
  for(let i=0; i<files.length; i++) {
    const v = files[i]
    if(isReactive(v)) {
      newList.push(toRaw(v))
    }
    else {
      newList.push(v)
    }
  }
  return newList
}