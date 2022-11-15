import { computed, Ref, ShallowRef } from "vue";
import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore";
import type { EditorCoreContent, TipTapJSONContent } from "../../../types/types-editor";
import type { TipTapEditor } from "../../../types/types-editor"
import type { ComputedRef } from "vue"
import type { ContentLocalTable } from "../../../types/types-table";
import ider from "../../../utils/basic/ider";
import { getLocalPreference } from "../../../utils/system/local-preference";
import type { CeState } from "./atom-ce"
import time from "../../../utils/basic/time";
import transferUtil from "../../../utils/transfer-util";
import liuUtil from "../../../utils/liu-util";
import { LiuRemindMe } from "../../../types/types-atom";
import localReq from "./req/local-req";
import type { GlobalStateStore } from "../../../hooks/stores/useGlobalStateStore"
import type { ThreadStore } from "../../../hooks/stores/useThreadStore";

// 本文件处理发表的逻辑

export interface CepContext {
  canSubmitRef: Ref<boolean>
  editor: ShallowRef<TipTapEditor | undefined>
  state: CeState
  threadStore: ThreadStore
}

export type CepToPost = () => void

let space: ComputedRef<string>
let member: ComputedRef<string>

export function useCeFinish(ctx: CepContext) {

  const spaceStore = useWorkspaceStore()
  space = computed(() => {
    if(!spaceStore.isCollaborative) return "ME"
    return spaceStore.spaceId
  })
  member = computed(() => {
    console.log("在 useCeFinish 里查看一下 member")
    const val = spaceStore.memberId
    console.log(val)
    console.log(" ")
    return val
  })

  const toFinish: CepToPost = () => {
    if(!member.value) return
    if(!ctx.canSubmitRef.value) return
    const { threadEdited } = ctx.state
    if(threadEdited) toUpdate(ctx)
    else toRelease(ctx)
  }

  return { toFinish }
}

// 去发表
async function toRelease(ctx: CepContext) {
  
  const { local_id: user } = getLocalPreference()
  if(!user) return

  const state = ctx.state
  const preThread = _getThreadData(state)
  if(!preThread) return

  const now = time.getTime()
  preThread._id = ider.createThreadId()
  preThread.user = user
  preThread.member = member.value
  preThread.createdStamp = now
  preThread.insertedStamp = now

  console.log("看一下 preThread.........")
  console.log(preThread)
  console.log(" ")

  // 1. 添加进 contents 表里
  const res1 = await localReq.addContent(preThread as ContentLocalTable)
  
  // 2. 删除 drafts
  if(state.draftId) await localReq.deleteDraftById(state.draftId)

  // 3. 重置编辑器的 state
  _resetState(state)

  // 4. 通知全局 需要更新 threads
  ctx.threadStore.setNewThreads([preThread as ContentLocalTable])

  // 5. 重置 editor
  ctx.editor.value?.chain().setContent('<p></p>').focus().run()
}

function _resetState(state: CeState) {
  delete state.draftId
  delete state.threadEdited
  state.visScope = "DEFAULT"
  delete state.title
  delete state.whenStamp
  delete state.remindMe
  delete state.images
  delete state.files
  delete state.editorContent
}


// 只有 _id / createdStamp / insertedStamp / user / member 
// 没有被添加进 state
function _getThreadData(
  state: CeState,
) {
  const now = time.getTime()
  const { editorContent } = state
  const contentJSON = editorContent?.json
  const list = contentJSON?.type === "doc" && contentJSON.content ? contentJSON.content : []
  const liuList = list.length > 0 ? transferUtil.tiptapToLiu(list) : undefined
  const liuDesc = liuUtil.getRawList(liuList)

  const storageState = state.storageState === 'CLOUD' ? 'WAIT_UPLOAD' : state.storageState
  const images = liuUtil.getRawList(state.images)
  const files = liuUtil.getRawList(state.files)
  const remindMe = liuUtil.toRawData(state.remindMe)
  const calendarStamp = _getCalendarStamp(state.whenStamp, remindMe)
  const whenStamp = state.whenStamp ? liuUtil.formatStamp(state.whenStamp) : undefined
  const remindStamp = _getRemindStamp(remindMe, whenStamp)
  
  const aThread: Partial<ContentLocalTable> = {
    infoType: "THREAD",
    oState: "OK",
    visScope: state.visScope,
    storageState,
    title: state.title,
    liuDesc,
    images,
    files,
    calendarStamp,
    remindStamp,
    whenStamp,
    remindMe,
    updatedStamp: now,
    editedStamp: now,
  }

  // 没有 threadEdited 代表当前是发表模式，必须设置 workspace
  if(!state.threadEdited) {
    aThread.workspace = space.value
  }

  return aThread
}

function _getCalendarStamp(
  whenStamp: number | undefined,
  remindMe: LiuRemindMe | undefined
): number | undefined {
  if(whenStamp) return liuUtil.formatStamp(whenStamp)
  if(!remindMe) return
  const { type, later, specific_stamp } = remindMe
  if(type === "specific_time" && specific_stamp) {
    return liuUtil.formatStamp(specific_stamp)
  }

  if(type === "later" && later) {
    return liuUtil.getLaterStamp(later)
  }
}

function _getRemindStamp(
  remindMe: LiuRemindMe | undefined,
  whenStamp: number | undefined,
): number | undefined {
  if(!remindMe) return
  const { type, early_minute, later, specific_stamp } = remindMe
  if(type === "specific_time" && specific_stamp) {
    return liuUtil.formatStamp(specific_stamp)
  }
  if(type === "early" && typeof early_minute === 'number' && whenStamp) {
    return liuUtil.getEarlyStamp(whenStamp, early_minute)
  }
  if(type === "later" && later) {
    return liuUtil.getLaterStamp(later)
  }
}


// 去更新
async function toUpdate(ctx: CepContext) {
  const state = ctx.state
  const preThread = _getThreadData(state)
  if(!preThread) return

  console.log("看一下 preThread.........")
  console.log(preThread)
  console.log(" ")

  const threadId = state.threadEdited as string

  // 1. 更新进 contents 表里
  const res1 = await localReq.updateContent(threadId, preThread)
  
  // 2. 删除 drafts
  if(state.draftId) await localReq.deleteDraftById(state.draftId)

  // 3. 重置编辑器的 state
  _resetState(state)

  // 4. 重置 editor
  ctx.editor.value?.chain().setContent('<p></p>').run()

  // 5. 查找该 thread，然后通知全局
  const theThread = await localReq.getThreadByThreadId(threadId)
  if(theThread) {
    ctx.threadStore.setUpdatedThreads([theThread])
  }

}

