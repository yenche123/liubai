import type { Ref, ShallowRef } from "vue";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { TipTapEditor } from "~/types/types-editor"
import type { ContentLocalTable } from "~/types/types-table";
import ider from "~/utils/basic/ider";
import localCache from "~/utils/system/local-cache";
import type { CeState, CeEmits } from "./atom-ce"
import time from "~/utils/basic/time";
import transferUtil from "~/utils/transfer-util";
import liuUtil from "~/utils/liu-util";
import type { LiuRemindMe } from "~/types/types-atom";
import localReq from "./req/local-req";
import type { ThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import { storeToRefs } from "pinia";
import { equipThreads } from "~/utils/controllers/equip/threads";
import { getTagIdsParents } from "~/utils/system/tag-related";
import type { SpaceType } from "~/types/types-basic";

// 本文件处理发表的逻辑

export interface CepContext {
  canSubmitRef: Ref<boolean>
  editor: ShallowRef<TipTapEditor | undefined>
  state: CeState
  threadShowStore: ThreadShowStore
  emits: CeEmits
}

export type CepToPost = (focusRequired: boolean) => void

let spaceIdRef: Ref<string>
let spaceTypeRef: Ref<SpaceType>
let member: Ref<string>

export function useCeFinish(ctx: CepContext) {

  const wStore = useWorkspaceStore()
  const spaceRefs = storeToRefs(wStore)
  spaceIdRef = spaceRefs.spaceId
  spaceTypeRef = spaceRefs.spaceType as Ref<SpaceType>
  member = spaceRefs.memberId

  const toFinish: CepToPost = (focusRequired: boolean) => {
    if(!member.value) return
    if(!ctx.canSubmitRef.value) return
    const { threadEdited } = ctx.state
    if(threadEdited) toUpdate(ctx)
    else toRelease(ctx, focusRequired)
  }

  return { toFinish }
}

// 去发表
async function toRelease(
  ctx: CepContext,
  focusRequired: boolean
) {
  
  const { local_id: user } = localCache.getLocalPreference()
  if(!user) return

  const state = ctx.state
  const preThread = _getThreadData(state)
  if(!preThread) return

  const now = time.getTime()
  preThread._id = ider.createThreadId()
  preThread.user = user
  preThread.member = member.value
  preThread.levelOne = 0
  preThread.levelOneAndTwo = 0
  preThread.emojiData = { total: 0, system: [] }
  preThread.createdStamp = now
  preThread.insertedStamp = now

  console.log("看一下 preThread.........")
  console.log(preThread)
  console.log(" ")

  const newThread = preThread as ContentLocalTable

  // 1. 添加进 contents 表里
  const res1 = await localReq.addContent(newThread)
  
  // 2. 删除 drafts
  if(state.draftId) await localReq.deleteDraftById(state.draftId)

  // 3. 重置编辑器的 state
  _resetState(ctx)
 
  // 4. 重置 editor
  const editor = ctx.editor.value
  if(!editor) return
  if(focusRequired) {
    editor.chain().setContent('<p></p>').focus().run()
  }
  else {
    editor.chain().setContent('<p></p>').run()
  }

  // 5. 通知全局 需要更新 threads
  const threadShows = await equipThreads([newThread])
  ctx.threadShowStore.setNewThreadShows(threadShows)
  
}

function _resetState(
  ctx: CepContext
) {
  const state = ctx.state

  delete state.draftId
  delete state.threadEdited
  state.overflowType = "visible"
  state.visScope = "DEFAULT"
  state.tagIds = []
  delete state.title
  delete state.whenStamp
  delete state.remindMe
  delete state.images
  delete state.files
  delete state.editorContent

  ctx.canSubmitRef.value = false
}


// _id / createdStamp / insertedStamp / user / member / commentNum / emojiData
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
  const tagIds = liuUtil.getRawList(state.tagIds)
  const tagSearched = getTagIdsParents(tagIds)

  const search_title = (state.title ?? "").toLowerCase()
  const search_other = (transferUtil.tiptapToText(liuDesc, true)).toLowerCase()

  // console.log("看一下 search_title: ", search_title)
  // console.log("看一下 search_other: ", search_other)
  
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
    tagIds,
    tagSearched,
    search_title,
    search_other,
  }

  // 没有 threadEdited 代表当前是发表模式，必须设置 workspace
  if(!state.threadEdited) {
    aThread.spaceId = spaceIdRef.value
    aThread.spaceType = spaceTypeRef.value
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
  if(state.draftId) {
    await localReq.deleteDraftById(state.draftId)
    delete state.draftId
  }

  // 3. 查找该 thread，然后通知全局
  const theThread = await localReq.getThreadByThreadId(threadId)
  if(!theThread) return
  const threadShows = await equipThreads([theThread])
  ctx.threadShowStore.setUpdatedThreadShows(threadShows)

  // 4. emits 到页面
  ctx.emits("updated", threadId)
}

