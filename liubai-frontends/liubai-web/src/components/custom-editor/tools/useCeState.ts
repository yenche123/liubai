
import { ref, watch, computed, toRaw, isProxy, isReactive } from "vue";
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
import type { ImageLocal } from "../../../types";

let initStamp = 0
let editorContent: EditorCoreContent | null = null
let space: ComputedRef<string>

export function useCeState(
  state: CeState,
  canSubmitRef: Ref<boolean>,
) {

  initStamp = time.getTime()

  const spaceStore = useWorkspaceStore()  
  space = computed(() => {
    if(!spaceStore.isCollaborative) return "ME"
    return spaceStore.spaceId
  })

  // 监听 输入框初始化的值
  watch(() => state.descInited, (newV) => {
    if(!newV || newV.length < 1) return
    const content = newV
    editorContent = {
      json: { type: "doc", content },
      text: transfer.tiptapToText(newV)
    }
    // console.log("看一下 自己生成的 text: ")
    // console.log(editorContent.text)
    // console.log(" ")
    checkCanSubmit(state, canSubmitRef)
  })

  // 监听用户操作 images 的变化，去存储到 IndexedDB 上
  watch(() => state.images, (newV) => {
    toImagesChange(state)
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

// 图片发生变化时，去保存
function toImagesChange(state: CeState) {
  const now = time.getTime()

  // 刚刚才 setup，拒绝缓存 images
  // 因为只是 images 初始化被赋值，获得的响应罢了
  if(initStamp + 300 > now) {
    return
  }

  collectState(state)
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

  // 响应式对象 转为普通对象
  if(isProxy(liuDesc)) liuDesc = toRaw(liuDesc)
  let images = _getStoragedImages(state)
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


function _getStoragedImages(state: CeState): ImageLocal[] | undefined {
  if(!state.images || state.images.length < 1) return
  const images = state.images
  const newList: ImageLocal[] = []
  for(let i=0; i<images.length; i++) {
    const v = images[i]
    if(isReactive(v)) {
      console.log("发现响应式的图片对象...........")
      newList.push(toRaw(v))
    }
    else {
      newList.push(v)
    }
  }
  return newList
}