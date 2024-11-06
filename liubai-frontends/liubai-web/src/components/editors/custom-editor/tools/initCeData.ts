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
  resetBasicCeData,
} from "./some-funcs"
import liuEnv from "~/utils/liu-env"
import type { 
  LiuDownloadDraft, 
  SyncGet_Draft, 
  SyncGet_ThreadData,
} from "~/types/cloud/sync-get/types"
import liuUtil from "~/utils/liu-util"
import { CloudMerger } from "~/utils/cloud/CloudMerger"
import ider from "~/utils/basic/ider"
import { useThrottleFn } from "~/hooks/useVueUse"
import { useActiveSyncNum } from "~/hooks/useCommon"
import { LocalToCloud } from "~/utils/cloud/LocalToCloud"

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

  const draft = await localReq.getDraft(spaceIdRef.value)
  if(draft) {
    setDataFromDraft(ctx, draft, loadCloud)
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
  const dState = draft?.oState
  if(dState === "DELETED" || dState === "POSTED") {
    draft = null
  }

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
    if(draft) setDataFromDraft(ctx, draft, loadCloud)
    return
  }

  // thread 编辑时间比较大的情况
  console.log("####### thread 编辑时间比较大的情况 ########")

  if(thread) setDataFromThread(ctx, thread, loadCloud)
  if(draft) localReq.deleteDraftById(draft._id)
}

// 尚未发表
async function setDataFromDraft(
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
  ceData.stateId = draft.stateId

  let descList = draft.liuDesc
  if(descList) {
    descList = transferUtil.liuToTiptap(descList)
  }
  setEditorContent(ctx, descList)
  checkToggleOfMore(ceData)

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


function checkToggleOfMore(ceData: CeData) {
  if(ceData.whenStamp || ceData.remindMe || ceData.stateId) {
    ceData.more = true
    return
  }
  if(ceData.files?.length) {
    ceData.more = true
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
  setDataFromThread(ctx, thread, loadCloudMore)
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

  // 4. check if cloud has data
  if(firRes.status !== "has_data") return
  const cloud_draft = firRes.draft
  if(!cloud_draft) return

  const local_draft_2 = await localReq.getDraftById(cloud_draft._id)

  const oState = cloud_draft.oState
  const localState = local_draft?.oState
  const localState_2 = local_draft_2?.oState
  
  // 5. if it is posted or deleted
  if(oState === "POSTED" || oState === "DELETED") {
    resetFromCloud(ctx, cloud_draft, local_draft, local_thread)
    return
  }

  // console.log("远程的 draft: ")
  // console.log(cloud_draft)
  // console.log("本地的 draft 1: ")
  // console.log(local_draft)
  // console.log("本地的 draft 2: ")
  // console.log(local_draft_2)

  // 6.1 localState is DELETED or POSTED
  if(localState === "POSTED" || localState === "DELETED") {
    if(cloud_draft.first_id === local_draft?.first_id) {
      console.warn("to clear posted draft......")
      LocalToCloud.addTask({
        uploadTask: "draft-clear",
        target_id: cloud_draft._id,
        operateStamp: time.getTime(),
      })
      return
    }
  }

  // 6.2 localState_2 is DELETED or POSTED
  if(localState_2 === "POSTED" || localState_2 === "DELETED") {
    console.warn("to clear posted draft 222......")
    LocalToCloud.addTask({
      uploadTask: "draft-clear",
      target_id: cloud_draft._id,
      operateStamp: time.getTime(),
    })
    return
  }

  // 7. pass if the id is in reject_draft_ids
  const cloud_id = cloud_draft._id
  const cloud_first_id = cloud_draft.first_id
  const reject_ids = ceData.reject_draft_ids
  if(reject_ids) {
    if(reject_ids.includes(cloud_id) || reject_ids.includes(cloud_first_id)) {
      localReq.deleteDraftById(cloud_id)
      return
    }
  }
  
  // 8. if it has been turned into LOCAL
  if(oState === "LOCAL") {
    if(local_draft?.oState === "LOCAL") return
    const s8 = ceData.storageState
    if(s8 === "LOCAL" || s8 === "ONLY_LOCAL") return
    ceData.storageState = "LOCAL"
    return
  }

  // 9. check out the diff between local and cloud
  const e1 = cloud_draft.editedStamp
  const e2 = local_draft?.editedStamp ?? 1
  const diff = e2 - e1
  if(diff < 0) {
    console.log("to merge draft ......")
    await toMergeDraft(ctx, cloud_draft)
    return
  }

  // 10. if local_draft is not matched with ceData.draftId
  const local_id = local_draft?._id
  if(local_id === cloud_id && local_id !== ceData.draftId) {
    console.warn("new feature: local_id === cloud_id && local_id !== ceData.draftId")
    console.log("local_id: ", local_id)
    console.log("cloud_id: ", cloud_id)
    console.log("ceData.draftId: ", ceData.draftId)
    console.log(" ")
    await toMergeDraft(ctx, cloud_draft)
    return
  }
  
}

async function toMergeDraft(
  ctx: IcsContext,
  cloud_draft: LiuDownloadDraft,
) {
  const { ceData } = ctx

  const oldDraftId = ceData.draftId
  ceData.lastLockStamp = time.getTime()
  ceData.draftId = cloud_draft._id
  ceData.visScope = cloud_draft.visScope ?? defaultData.visScope
  ceData.title = cloud_draft.title
  ceData.showTitleBar = Boolean(cloud_draft.title)
  ceData.whenStamp = cloud_draft.whenStamp
  ceData.remindMe = cloud_draft.remindMe
  ceData.tagIds = cloud_draft.tagIds ?? []
  ceData.stateId = cloud_draft.stateId

  let descJSON: TipTapJSONContent[] | undefined
  if(cloud_draft.liuDesc) {
    descJSON = transferUtil.liuToTiptap(cloud_draft.liuDesc)
  }
  setEditorContent(ctx, descJSON)
  checkToggleOfMore(ceData)

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
  let hasSet = false

  // 1. get old text
  let oldText = ""
  const oldJSON = editor.getJSON()
  if(oldJSON.type === "doc" && oldJSON.content) {
    oldText = transferUtil.tiptapToText(oldJSON.content).trim()
  }

  // 2. check if the text is different
  if(draftDescJSON) {
    let text = transferUtil.tiptapToText(draftDescJSON).trim()
    if(text !== oldText) {
      hasSet = true
      let json = { type: "doc", content: draftDescJSON }
      editor.commands.setContent(json)
      ceData.editorContent = { text, json }
    }
  }
  else {
    hasSet = true
    editor.commands.setContent("<p></p>")
    delete ceData.editorContent
  }

  // 3. if the text is different, increase the numWhenSet
  if(hasSet) {
    numWhenSet.value++
  }

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

  console.warn("准备去重置数据.......")
  console.log("看一下 local_draft:")
  console.log(local_draft)
  console.log("diff: ", diff)

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

  // 3. delete the draft
  const old_id = ceData.draftId
  if(old_id) {
    localReq.deleteDraftById(old_id)
  }
  delete ceData.draftId

  // 4. if threadEdited and local_thread exist
  //   init it from thread
  if(ceData.threadEdited) {
    if(local_thread) {
      setDataFromThread(ctx, local_thread, false)
    }
    return
  }

  // 5. reset all
  console.warn("reset all")
  resetBasicCeData(ceData)
  setEditorContent(ctx)
}


async function setDataFromThread(
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
  ceData.stateId = thread.stateId

  let descJSON: TipTapJSONContent[] | undefined
  if(thread.liuDesc) {
    descJSON = transferUtil.liuToTiptap(thread.liuDesc)
  }
  setEditorContent(ctx, descJSON)
  checkToggleOfMore(ceData)

  if(loadCloud) {
    initFromCloudDraft(ctx, undefined, thread)
  }
}