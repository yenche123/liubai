import type { Ref, ShallowRef } from "vue";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { TipTapEditor } from "~/types/types-editor"
import type { ContentLocalTable } from "~/types/types-table";
import ider from "~/utils/basic/ider";
import localCache from "~/utils/system/local-cache";
import { defaultData, type CeData, type CeEmits } from "./types"
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
import { LocalToCloud } from "~/utils/cloud/LocalToCloud";
import liuConsole from "~/utils/debug/liu-console";

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

// 去发表
async function toRelease(
  ctx: CepContext,
  focusRequired: boolean
) {
  
  const { local_id: user } = localCache.getPreference()
  if(!user) return

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

  // console.log("看一下 preThread.........")
  // console.log(preThread)
  // console.log(" ")

  const newThread = preThread as ContentLocalTable

  // 1. 添加进 contents 表里
  const res1 = await localReq.addContent(newThread)
  
  // 2. 删除 drafts
  const draftId = ceData.draftId
  if(draftId) {
    await localReq.clearDraftOnCloud(draftId)
    await localReq.setDraftAsPosted(draftId)
    if(!ceData.reject_draft_ids) {
      ceData.reject_draft_ids = []
    }
    ceData.reject_draft_ids.push(draftId)
  }

  // 3. 重置编辑器的 ceData
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

  // 6. logger
  liuConsole.sendMessage("User released a thread")

  // 7. 如果是本地的动态，忽略去同步后端
  const storageState = preThread.storageState
  if(storageState === "LOCAL" || storageState === "ONLY_LOCAL") return

  // 8. 去同步后端
  LocalToCloud.addTask({ 
    uploadTask: "thread-post", 
    target_id: newId,
    operateStamp: now,
  }, { speed: "instant" })
  
}


// reset after releasing
function _resetState(
  ctx: CepContext
) {
  const { ceData } = ctx

  ceData.lastLockStamp = time.getTime()
  delete ceData.draftId
  delete ceData.threadEdited
  ceData.visScope = defaultData.visScope
  ceData.tagIds = []
  delete ceData.title
  delete ceData.whenStamp
  delete ceData.remindMe
  delete ceData.images
  delete ceData.files
  delete ceData.editorContent
  delete ceData.lastEditStamp

  ceData.canSubmit = false
}

// reset after updating
function _resetState2(
  ctx: CepContext,
) {
  const { ceData } = ctx
  delete ceData.lastEditStamp
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

  const { storageState } = ceData
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

  // console.log("看一下 preThread.........")
  // console.log(preThread)
  // console.log(" ")

  const threadId = ceData.threadEdited as string

  // 0. get old content
  const oldContent = await localReq.getContentById(threadId)
  if(!oldContent) return

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

  // 2. 更新进 contents 表里
  await localReq.updateContent(threadId, preThread)
  
  // 3. 删除 drafts
  if(ceData.draftId) {
    await localReq.clearDraftOnCloud(ceData.draftId)
    await localReq.deleteDraftById(ceData.draftId)
    delete ceData.draftId
  }

  // 4. 查找该 thread，然后通知全局
  const theThread = await localReq.getContentById(threadId)
  if(!theThread) return
  const threadShows = await equipThreads([theThread])
  ctx.threadShowStore.setUpdatedThreadShows(threadShows, "edit")

  // 5. emits 到页面
  ctx.emits("updated", threadId)

  // 6. logger
  liuConsole.sendMessage("User edited a thread")

  // 7. reset
  _resetState2(ctx)

  // 8. 如果是本地的动态，检查是否要 go to thread-only_local
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

  // 9. 否则，去发表或上传
  const uploadTask = newSs === "WAIT_UPLOAD" ? "thread-post" : "thread-edit"
  LocalToCloud.addTask({ 
    uploadTask, 
    target_id,
    operateStamp,
  }, { speed: "instant" })
}

