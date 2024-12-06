import type { Ref, ShallowRef } from "vue";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { TipTapEditor } from "~/types/types-editor"
import type { ContentLocalTable } from "~/types/types-table";
import ider from "~/utils/basic/ider";
import localCache from "~/utils/system/local-cache";
import { type CeData, type CeEmits } from "./types"
import time from "~/utils/basic/time";
import transferUtil from "~/utils/transfer-util";
import liuUtil from "~/utils/liu-util";
import localReq from "./req/local-req";
import type { ThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import { storeToRefs } from "pinia";
import { equipThreads } from "~/utils/controllers/equip/threads";
import { getTagIdsParents } from "~/utils/system/tag-related";
import type { SpaceType } from "~/types/types-basic";
import { LocalToCloud } from "~/utils/cloud/LocalToCloud";
import liuConsole from "~/utils/debug/liu-console";
import { resetBasicCeData } from "./some-funcs";
import { setStateForNewThread } from "~/hooks/thread/specific-operate/state";

// 本文件处理发表的逻辑

export interface CepContext {
  editor: ShallowRef<TipTapEditor | undefined>
  ceData: CeData
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
    if(!ctx.ceData.canSubmit) return
    const { threadEdited } = ctx.ceData
    if(threadEdited) toUpdate(ctx)
    else toRelease(ctx, focusRequired)
  }

  return { toFinish }
}

// to release
async function toRelease(
  ctx: CepContext,
  focusRequired: boolean
) {
  
  const { local_id: user } = localCache.getPreference()
  if(!user) return

  // 1. get new thread data
  const { ceData } = ctx
  const preThread = _getThreadData(ceData)
  if(!preThread) return

  const now = time.getTime()
  const newId = ider.createThreadId()
  preThread._id = newId
  preThread.first_id = newId
  preThread.user = user
  preThread.member = member.value
  preThread.levelOne = 0
  preThread.levelOneAndTwo = 0
  preThread.emojiData = { total: 0, system: [] }
  preThread.createdStamp = now
  preThread.insertedStamp = now
  const newThread = preThread as ContentLocalTable
  
  // 2. to release
  releaseAsync(ctx, newThread)

  // 3. reset ceData
  _resetState(ctx)
 
  // 4. reset editor
  _resetEditor(ctx, focusRequired)
}

async function releaseAsync(
  ctx: CepContext,
  newThread: ContentLocalTable,
) {
  const ceData = ctx.ceData
  const draftId = ceData.draftId
  const newId = newThread._id
  const stamp = newThread.insertedStamp

  // 1. add new thread into db
  await localReq.addContent(newThread)

  // 2. delete drafts
  if(draftId) {
    localReq.clearDraftOnCloud(draftId)
    await localReq.setDraftAsPosted(draftId)
    if(!ceData.reject_draft_ids) {
      ceData.reject_draft_ids = []
    }
    ceData.reject_draft_ids.push(draftId)
  }

  // 3. notify other components
  const threadShows = await equipThreads([newThread])
  if(newThread.stateId) {
    await setStateForNewThread(threadShows[0])
  }
  ctx.threadShowStore.setNewThreadShows(threadShows)

  // 4. ignore if it's a local thread
  const storageState = newThread.storageState
  if(storageState === "LOCAL" || storageState === "ONLY_LOCAL") return

  // 5. upload to cloud
  LocalToCloud.addTask({ 
    uploadTask: "thread-post", 
    target_id: newId,
    operateStamp: stamp,
  }, { speed: "instant" })
}


function _resetEditor(
  ctx: CepContext,
  focusRequired: boolean,
) {
  const editor = ctx.editor.value
  if(!editor) return
  if(focusRequired) {
    editor.chain().setContent('<p></p>').focus().run()
  }
  else {
    editor.chain().setContent('<p></p>').run()
  }
}


// reset
function _resetState(
  ctx: CepContext
) {
  const { ceData } = ctx
  resetBasicCeData(ceData)
  delete ceData.editorContent
}

// _id / createdStamp / insertedStamp / user / member / commentNum / emojiData
// 没有被添加进 ceData
function _getThreadData(
  ceData: CeData,
) {
  const now = time.getTime()
  const { editorContent } = ceData
  const contentJSON = editorContent?.json
  const list = contentJSON?.type === "doc" && contentJSON.content ? contentJSON.content : []
  const liuList = list.length > 0 ? transferUtil.tiptapToLiu(list) : undefined
  const liuDesc = liuUtil.getRawList(liuList)

  const { storageState, aiReadable } = ceData
  const images = liuUtil.getRawList(ceData.images)
  const files = liuUtil.getRawList(ceData.files)
  const remindMe = liuUtil.toRawData(ceData.remindMe)
  const calendarStamp = liuUtil.getCalendarStamp(ceData.whenStamp, remindMe)
  const whenStamp = ceData.whenStamp ? liuUtil.formatStamp(ceData.whenStamp) : undefined
  const remindStamp = liuUtil.getRemindStamp(remindMe, whenStamp)
  const tagIds = liuUtil.getRawList(ceData.tagIds)
  const tagSearched = getTagIdsParents(tagIds)

  const search_title = (ceData.title ?? "").toLowerCase()
  const search_other = transferUtil.packSearchOther(liuDesc, files)

  // console.log("看一下 search_title: ", search_title)
  // console.log("看一下 search_other: ", search_other)
  
  const aThread: Partial<ContentLocalTable> = {
    infoType: "THREAD",
    oState: "OK",
    visScope: ceData.visScope,
    storageState,
    aiReadable,
    title: ceData.title,
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
    stateId: ceData.stateId,
    search_title,
    search_other,
  }

  // 没有 threadEdited 代表当前是发表模式，必须设置 workspace
  if(!ceData.threadEdited) {
    aThread.spaceId = spaceIdRef.value
    aThread.spaceType = spaceTypeRef.value

    if(storageState === "CLOUD") {
      aThread.storageState = "WAIT_UPLOAD"
    }
  }

  return aThread
}


// 去更新
async function toUpdate(ctx: CepContext) {
  const { ceData } = ctx
  const preThread = _getThreadData(ceData)
  if(!preThread) return
  const threadId = ceData.threadEdited as string

  // 1. get old content
  const oldContent = await localReq.getContentById(threadId)
  if(!oldContent) return

  // 2. update
  updateAsync(ctx, oldContent, preThread)

  // 3. reset
  _resetState(ctx)

  // 4. reset editor
  _resetEditor(ctx, false)
}


async function updateAsync(
  ctx: CepContext,
  oldContent: ContentLocalTable,
  preThread: Partial<ContentLocalTable>,
) {
  const ceData = ctx.ceData
  const threadId = ceData.threadEdited as string
  const draftId = ceData.draftId

  // 1. recheck storageState
  const oldSs = oldContent.storageState
  if(oldSs === "LOCAL" && preThread.storageState === "CLOUD") {
    preThread.storageState = "WAIT_UPLOAD"
  }
  const newSs = preThread.storageState
  let goThreadOnlyLocal = false
  if(oldSs === "CLOUD" && newSs === "LOCAL") {
    goThreadOnlyLocal = true
    preThread.storageState = "ONLY_LOCAL"
  }
  else if(oldSs === "WAIT_UPLOAD" && newSs === "LOCAL") {
    goThreadOnlyLocal = true
  }

  // 2. update content in db
  await localReq.updateContent(threadId, preThread)

  // 3. delete drafts
  if(draftId) {
    localReq.clearDraftOnCloud(draftId)
    await localReq.setDraftAsDeleted(draftId)
    if(!ceData.reject_draft_ids) {
      ceData.reject_draft_ids = []
    }
    ceData.reject_draft_ids.push(draftId)
  }

  // 4. notify other components
  const theThread = await localReq.getContentById(threadId)
  if(!theThread) return
  const threadShows = await equipThreads([theThread])
  if(oldContent.stateId !== theThread.stateId) {
    await setStateForNewThread(threadShows[0])
  }
  ctx.threadShowStore.setUpdatedThreadShows(threadShows, "edit")

  // 5. emits to page
  ctx.emits("updated", threadId)

  // 6. If it is a local post, check whether to go to thread-only_local
  const target_id = threadId
  const operateStamp = theThread.updatedStamp
  if(newSs === "LOCAL" || newSs === "ONLY_LOCAL") {
    if(goThreadOnlyLocal) {
      LocalToCloud.addTask({ 
        uploadTask: "thread-only_local", 
        target_id,
        operateStamp,
      }, { speed: "instant" })
    }
    return
  }

  // 7. otherwise, to post or upload
  const uploadTask = newSs === "WAIT_UPLOAD" ? "thread-post" : "thread-edit"
  LocalToCloud.addTask({ 
    uploadTask, 
    target_id,
    operateStamp,
  }, { speed: "instant" })
}

