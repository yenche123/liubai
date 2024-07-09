// 初始化 编辑器上的文本
// 仅从本地缓存上寻找！

import type { TipTapEditor, TipTapJSONContent } from "~/types/types-editor"
import { reactive, ref, provide, watch, toRef } from "vue"
import type { ShallowRef, Ref } from "vue"
import type { CeData, CeEmits, CeProps } from "./types"
import { defaultData } from "./types"
import type { ContentLocalTable, DraftLocalTable } from "~/types/types-table"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import localReq from "./req/local-req"
import transferUtil from "~/utils/transfer-util"
import { editorSetKey } from "~/utils/provide-keys"
import { storeToRefs } from "pinia"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"
import time from "~/utils/basic/time"
import { 
  getRemindMeFromThread, 
  checkIfEditorHasData,
  checkCanSubmit,
} from "./some-funcs"
import liuEnv from "~/utils/liu-env"
import type { 
  LiuDownloadDraft, 
  SyncGet_Draft, 
  SyncGet_ThreadData,
} from "~/types/cloud/sync-get/types"
import liuUtil from "~/utils/liu-util"
import { CloudMerger } from "~/utils/cloud/CloudMerger"
import { CloudFiler } from "~/utils/cloud/CloudFiler"
import ider from "~/utils/basic/ider"
import { useThrottleFn } from "~/hooks/useVueUse"
import { useActiveSyncNum } from "~/hooks/useCommon"

const SEC_6 = 6 * time.SECONED
const SEC_30 = 30 * time.SECONED
let spaceIdRef: Ref<string>

interface IcsContext {
  ceData: CeData
  editor: TipTapEditor
  numWhenSet: Ref<number>
  emits: CeEmits
}

export function initCeData(
  props: CeProps,
  emits: CeEmits,
  editor: ShallowRef<TipTapEditor | undefined>,
) {

  const spaceStore = useWorkspaceStore()  
  spaceIdRef = storeToRefs(spaceStore).spaceId

  const threadIdRef = toRef(props, "threadId")
  
  // 不能用 shallowReactive 
  // 因为 images 属性必须监听内部数据的变化
  let ceData = reactive<CeData>({
    ...defaultData,
    threadEdited: threadIdRef.value,
    lastLockStamp: time.getTime(),
  })
  
  const numWhenSet = ref(0)
  provide(editorSetKey, numWhenSet)

  const preInit = useThrottleFn((
    ctx: IcsContext,
  ) => {
    initDraft(ctx, false)
  }, 1500)

  const preInitWithCloud = useThrottleFn((
    ctx: IcsContext,
  ) => {
    initDraft(ctx, true)
  }, 3000)

  const getCtx = () => {
    const editorVal = editor.value
    const spaceId = spaceIdRef.value
    if(!editorVal || !spaceId) return
    const ctx: IcsContext = {
      ceData,
      editor: editorVal,
      numWhenSet,
      emits,
    }
    return ctx
  }

  const whenCtxChanged = (cloud: boolean) => {
    const ctx = getCtx()
    if(!ctx) return
    ceData.threadEdited = threadIdRef.value
    if(cloud) {
      preInitWithCloud(ctx)
    }
    else {
      preInit(ctx)
    }
  }

  watch([editor, spaceIdRef, threadIdRef], () => {
    whenCtxChanged(false)
  })
  
  const { activeSyncNum } = useActiveSyncNum()
  watch(activeSyncNum, (newV) => {
    if(newV < 1) return
    whenCtxChanged(true)
  })

  // 监听 tag 从其他组件发生变化
  const gStore = useGlobalStateStore()
  const { tagChangedNum } = storeToRefs(gStore)
  watch(tagChangedNum, (newV) => {
    if(time.isWithinMillis(ceData.lastTagChangeStamp ?? 1, 750)) return
    whenCtxChanged(false)
  })

  return { ceData }
}

// spaceId 有值的周期内，本地的 user_id 肯定存在了
async function initDraft(
  ctx: IcsContext,
  loadCloud: boolean,
) {
  const threadId = ctx.ceData.threadEdited
  const { lastEditStamp = 1 } = ctx.ceData
  if(time.isWithinMillis(lastEditStamp, SEC_6)) {
    return
  }

  // if threadId exists, initDraftWithThreadId()
  if(threadId) {
    // 使用 lastWin 法则，比较 thread 和 draft
    initDraftWithThreadId(ctx, threadId, loadCloud)
    return
  }

  let draft = await localReq.getDraft(spaceIdRef.value)
  const _id = draft?._id
  const oState = draft?.oState
  if(_id && (oState === "POSTED" || oState === "DELETED")) {
    localReq.deleteDraftById(_id)
    draft = null
  }
  
  if(draft) {
    initDraftFromDraft(ctx, draft, loadCloud)
  }
  else {
    ctx.ceData.draftId = ""
    if(loadCloud) {
      initFromCloudDraft(ctx)
    }
  }
}


async function initDraftWithThreadId(
  ctx: IcsContext,
  threadId: string,
  loadCloud: boolean = true,
) {
  let draft = await localReq.getDraftByThreadId(threadId)
  let thread = await localReq.getContentById(threadId)

  if(!draft && !thread) {
    initFromCloudThread(ctx, threadId, true)
    return
  }
  ctx.emits("hasdata", threadId)
  
  let e1 = draft?.editedStamp ?? 1
  let e2 = thread?.editedStamp ?? 1

  // draft 编辑时间比较大的情况
  if(e1 > e2) {
    console.log("####### draft 编辑时间比较大的情况 ########")
    if(draft) initDraftFromDraft(ctx, draft, loadCloud)
    return
  }

  // thread 编辑时间比较大的情况
  console.log("####### thread 编辑时间比较大的情况 ########")

  if(thread) initDraftFromThread(ctx, thread, loadCloud)
  if(draft) localReq.deleteDraftById(draft._id)
}

// 尚未发表
async function initDraftFromDraft(
  ctx: IcsContext,
  draft: DraftLocalTable,
  loadCloud: boolean = true,
) {
  let { ceData } = ctx

  // 开始处理 draft 有值的情况
  ceData.lastLockStamp = time.getTime()
  ceData.draftId = draft._id

  if(draft.visScope) {
    ceData.visScope = draft.visScope
  }
  
  const canSync = liuEnv.canISync()
  if(!canSync) {
    ceData.storageState = "LOCAL"
  }
  else if(draft.storageState) {
    ceData.storageState = draft.storageState
  }

  ceData.title = draft.title
  ceData.showTitleBar = Boolean(draft.title)
  ceData.whenStamp = draft.whenStamp
  ceData.remindMe = draft.remindMe
  ceData.images = draft.images
  ceData.files = draft.files
  ceData.tagIds = draft.tagIds ?? []

  let descList = draft.liuDesc
  if(descList) {
    descList = transferUtil.liuToTiptap(descList)
  }
  setEditorContent(ctx, descList)

  if(!loadCloud) return

  const threadId = ceData.threadEdited
  const hasData = checkIfEditorHasData(ceData)

  if(threadId || hasData) {
    initFromCloudDraft(ctx, draft)
  }
  else {
    initFromCloudDraft(ctx)
  }
}


async function initFromCloudThread(
  ctx: IcsContext,
  threadId: string,
  loadCloudMore: boolean,
) {
  const canSync = liuEnv.canISync()
  if(!canSync) {
    ctx.emits("nodata", threadId)
    return
  }
  const opt: SyncGet_ThreadData = {
    taskType: "thread_data",
    id: threadId,
  }
  const res = await CloudMerger.request(opt, { delay: 0 })
  let thread = await localReq.getContentById(threadId)
  if(!thread) {
    ctx.emits("nodata", threadId)
    return
  }
  ctx.emits("hasdata", threadId)
  initDraftFromThread(ctx, thread, loadCloudMore)
}


async function initFromCloudDraft(
  ctx: IcsContext,
  local_draft?: DraftLocalTable,
  local_thread?: ContentLocalTable,
  delay?: number,
) {
  const canSync = liuEnv.canISync()
  if(!canSync) return

  // 0. get some required params
  const { ceData } = ctx

  // 1. construct opt for cloud
  const opt: SyncGet_Draft = {
    taskType: "draft_data",
  }

  if(local_draft) {
    const res1 = liuUtil.check.hasEverSynced(local_draft)
    if(!res1) return
    opt.draft_id = local_draft._id
  }
  else if(local_thread) {
    const res2 = liuUtil.check.canUpload(local_thread)
    if(!res2) return
    opt.threadEdited = local_thread._id
    delay = 0
  }
  else {
    opt.spaceId = spaceIdRef.value
  }

  // 2. to merge
  console.log("initFromCloudDraft opt: ")
  console.log(opt)
  console.log(" ")

  const res = await CloudMerger.request(opt, { delay, maxStackNum: 4 })

  // 3. filter nothing
  if(!res) return
  const firRes = res[0]
  if(!firRes) return
  if(firRes.parcelType !== "draft") return

  // 3.1 if not_found
  if(firRes.status === "not_found") {
    if(local_draft) {
      let threadId = local_draft.threadEdited
      ceData.draftId = ""
      if(threadId) {
        initFromCloudThread(ctx, threadId, false)
      }
      else {
        initFromCloudDraft(ctx, undefined, undefined, 0)
      }
      
    }
    return
  }

  if(firRes.status !== "has_data") return
  const cloud_draft = firRes.draft
  if(!cloud_draft) return


  // 4. get latest local thread & draft
  if(ceData.draftId) {
    local_draft = await localReq.getDraftById(ceData.draftId)
  }
  if(ceData.threadEdited) {
    local_thread = await localReq.getContentById(ceData.threadEdited)
  }

  const oState = cloud_draft.oState
  

  // 5. if it is posted or deleted
  if(oState === "POSTED" || oState === "DELETED") {
    resetFromCloud(ctx, cloud_draft, local_draft, local_thread)
    return
  }
  
  // 6. if it has been turned into LOCAL
  if(oState === "LOCAL") {
    if(local_draft?.oState === "LOCAL") return
    const s6 = ceData.storageState
    if(s6 === "LOCAL" || s6 === "ONLY_LOCAL") return
    ceData.storageState = "LOCAL"
    return
  }

  // 7. check out the diff between local and cloud
  const e1 = cloud_draft.editedStamp
  const e2 = local_draft?.editedStamp ?? 1
  const diff = e2 - e1
  if(diff > SEC_30) return

  const oldDraftId = ceData.draftId
  ceData.lastLockStamp = time.getTime()
  ceData.draftId = cloud_draft._id
  ceData.visScope = cloud_draft.visScope ?? defaultData.visScope
  ceData.title = cloud_draft.title
  ceData.showTitleBar = Boolean(cloud_draft.title)
  ceData.whenStamp = cloud_draft.whenStamp
  ceData.remindMe = cloud_draft.remindMe
  
  const {
    updated: updated_1,
    images,
  } = CloudFiler.updateImages(cloud_draft.images, ceData.images)
  if(updated_1) {
    ceData.images = images
  }

  const {
    updated: updated_2,
    files,
  } = CloudFiler.updateFiles(cloud_draft.files, ceData.files)
  if(updated_2) {
    ceData.files = files
  }

  ceData.tagIds = cloud_draft.tagIds ?? []

  let descJSON: TipTapJSONContent[] | undefined
  if(cloud_draft.liuDesc) {
    descJSON = transferUtil.liuToTiptap(cloud_draft.liuDesc)
  }
  setEditorContent(ctx, descJSON)

  if(updated_1 || updated_2) {
    CloudFiler.notify("drafts", cloud_draft._id)
  }

  if(oldDraftId !== cloud_draft._id) {
    if(oldDraftId) {
      await localReq.deleteDraftById(oldDraftId)
    }
  }
  
}

function setEditorContent(
  ctx: IcsContext,
  draftDescJSON?: TipTapJSONContent[],
) {
  const { ceData, editor, numWhenSet } = ctx
  if(draftDescJSON) {
    let text = transferUtil.tiptapToText(draftDescJSON)
    let json = { type: "doc", content: draftDescJSON }

    editor.commands.setContent(json)
    ceData.editorContent = { text, json }
  }
  else {
    editor.commands.setContent("<p></p>")
    delete ceData.editorContent
  }
  numWhenSet.value++
  checkCanSubmit(ceData)
}

async function resetFromCloud(
  ctx: IcsContext,
  cloud_draft: LiuDownloadDraft,
  local_draft?: DraftLocalTable,
  local_thread?: ContentLocalTable,
) {
  const { ceData } = ctx

  // 1. calculate diff
  const e1 = cloud_draft.editedStamp
  const e2 = local_draft?.editedStamp ?? 1
  const diff = e2 - e1

  // 2. reserve current input
  if(local_draft && diff > SEC_30) {
    console.warn("reserve the current draft but change its id")
    // 保留当前输入框里的内容
    let newId = ider.createDraftId()
    local_draft._id = newId
    local_draft.first_id = newId
    await localReq.setDraft(local_draft)
    await localReq.deleteDraftById(cloud_draft._id)
    ceData.draftId = newId
    return
  }

  delete ceData.draftId

  // 3. if threadEdited and local_thread exist
  //   init it from thread
  if(ceData.threadEdited) {
    if(local_thread) {
      initDraftFromThread(ctx, local_thread, false)
    }
    return
  }

  // 4. reset all
  console.warn("reset all")
  ceData.lastLockStamp  = time.getTime()
  ceData.visScope = defaultData.visScope
  ceData.tagIds = []
  delete ceData.title
  delete ceData.whenStamp
  delete ceData.remindMe
  delete ceData.images
  delete ceData.files
  
  setEditorContent(ctx)
  ceData.canSubmit = false
}


async function initDraftFromThread(
  ctx: IcsContext,
  thread: ContentLocalTable,
  loadCloud: boolean = true,
) {
  let { ceData } = ctx
  const canSync = liuEnv.canISync()
  ceData.lastLockStamp = time.getTime()
  ceData.draftId = ""
  ceData.visScope = thread.visScope
  ceData.storageState = !canSync ? "LOCAL" : thread.storageState
  ceData.title = thread.title
  ceData.showTitleBar = Boolean(thread.title)
  ceData.whenStamp = thread.whenStamp
  ceData.remindMe = getRemindMeFromThread(thread)
  ceData.images = thread.images
  ceData.files = thread.files
  ceData.tagIds = thread.tagIds ?? []

  let descJSON: TipTapJSONContent[] | undefined
  if(thread.liuDesc) {
    descJSON = transferUtil.liuToTiptap(thread.liuDesc)
  }
  setEditorContent(ctx, descJSON)

  if(loadCloud) {
    initFromCloudDraft(ctx, undefined, thread)
  }
}