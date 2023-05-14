// 初始化 编辑器上的文本
// 仅从本地缓存上寻找！


import type { TipTapEditor } from "~/types/types-editor"
import { reactive, watchEffect, ref, provide, watch, toRef } from "vue"
import type { ShallowRef, Ref } from "vue"
import type { CeState, CeEmits, CeProps } from "./atom-ce"
import { defaultState } from "./atom-ce"
import type { ContentLocalTable, DraftLocalTable } from "~/types/types-table"
import { LiuRemindMe } from "~/types/types-atom"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import localReq from "./req/local-req"
import transferUtil from "~/utils/transfer-util"
import { editorSetKey } from "~/utils/provide-keys"
import { storeToRefs } from "pinia"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"
import time from "~/utils/basic/time"
import { handleOverflow } from "./handle-overflow"

let spaceIdRef: Ref<string>

interface IcsContext {
  state: CeState
  editor: TipTapEditor
  numWhenSet: Ref<number>
  emits: CeEmits
}

export function initCeState(
  props: CeProps,
  emits: CeEmits,
  editor: ShallowRef<TipTapEditor | undefined>,
) {

  const spaceStore = useWorkspaceStore()  
  spaceIdRef = storeToRefs(spaceStore).spaceId

  
  const tVal = toRef(props, "threadId")
  
  // 不能用 shallowReactive 
  // 因为 images 属性必须监听内部数据的变化
  let state = reactive<CeState>({
    ...defaultState,
    threadEdited: tVal.value,
    lastInitStamp: time.getTime(),
  })
  
  const numWhenSet = ref(0)
  provide(editorSetKey, numWhenSet)

  const getCtx = () => {
    const editorVal = editor.value
    const spaceId = spaceIdRef.value
    if(!editorVal || !spaceId) return
    const ctx: IcsContext = {
      state,
      editor: editorVal,
      numWhenSet,
      emits,
    }
    return ctx
  }

  watchEffect(() => {
    const ctx = getCtx()
    if(!ctx) return
    // console.log("去 initDraft.........")
    state.threadEdited = tVal.value
    initDraft(ctx, tVal.value)
  })

  // 监听 tag 从外部发生变化
  const gStore = useGlobalStateStore()
  const { tagChangedNum } = storeToRefs(gStore)
  watch(tagChangedNum, (newV) => {
    const diff = time.getTime() - (state.lastTagChangeStamp ?? 1)
    if(diff < 500) return
    const ctx = getCtx()
    if(!ctx) return
    // console.log("再次 initDraft.........")
    initDraft(ctx, tVal.value)
  })

  return { state }
}

// spaceId 有值的周期内，本地的 user_id 肯定存在了
async function initDraft(
  ctx: IcsContext,
  threadId?: string,
) {
  let draft: DraftLocalTable | null = null
  if(threadId) {
    // 使用 lastWin 法则，比较 thread 和 draft

    draft = await localReq.getDraftByThreadId(threadId)
    let thread = await localReq.getThreadByThreadId(threadId)

    if(!draft && !thread) {
      ctx.emits("nodata", threadId)
      return
    }
    ctx.emits("hasdata", threadId)
    
    let e1 = draft?.editedStamp ?? 1
    let e2 = thread?.editedStamp ?? 1

    // draft 编辑时间比较大的情况
    if(e1 > e2) {
      console.log("####### draft 编辑时间比较大的情况 ########")
      if(draft) initDraftFromDraft(ctx, draft)
      return
    }

    // thread 编辑时间比较大的情况
    console.log("####### thread 编辑时间比较大的情况 ########")

    if(thread) initDraftFromThread(ctx, thread)
    if(draft) localReq.deleteDraftById(draft._id)
  }
  else {
    draft = await localReq.getDraft(spaceIdRef.value)
    if(draft) initDraftFromDraft(ctx, draft)
    else ctx.state.draftId = ""
  }
  
}

// 尚未发表
async function initDraftFromDraft(
  ctx: IcsContext,
  draft: DraftLocalTable,
) {
  let { state, editor, numWhenSet } = ctx

  // 开始处理 draft 有值的情况
  state.lastInitStamp = time.getTime()
  state.draftId = draft._id

  if(draft.visScope) {
    state.visScope = draft.visScope
  }

  if(draft.storageState) {
    state.storageState = draft.storageState
  }

  state.title = draft.title
  state.whenStamp = draft.whenStamp
  state.remindMe = draft.remindMe
  state.images = draft.images
  state.files = draft.files
  state.tagIds = draft.tagIds ?? []
  
  if(draft.liuDesc) {
    let text = transferUtil.tiptapToText(draft.liuDesc)
    let json = { type: "doc", content: draft.liuDesc }

    editor.commands.setContent(json)
    state.editorContent = { text, json }
    handleOverflow(state)
    numWhenSet.value++
  }
}

async function initDraftFromThread(
  ctx: IcsContext,
  thread: ContentLocalTable,
) {
  let { state, editor, numWhenSet } = ctx

  state.lastInitStamp = time.getTime()
  state.draftId = ""
  state.visScope = thread.visScope
  state.storageState = thread.storageState
  state.title = thread.title
  state.whenStamp = thread.whenStamp
  state.remindMe = _getRemindMeFromThread(thread)
  state.images = thread.images
  state.files = thread.files
  state.tagIds = thread.tagIds ?? []

  if(thread.liuDesc) {
    let draftDescJSON = transferUtil.liuToTiptap(thread.liuDesc)
    let text = transferUtil.tiptapToText(draftDescJSON)
    let json = { type: "doc", content: draftDescJSON }

    editor.commands.setContent(json)
    state.editorContent = { text, json }
    handleOverflow(state)
    numWhenSet.value++
  }
}


// 从 thread 中判断 "xx 之后提醒我" 这个值怎么转成确切时间点
function _getRemindMeFromThread(
  thread: ContentLocalTable
): LiuRemindMe | undefined {
  const oldRemindMe = thread.remindMe
  if(!oldRemindMe) return
  const oldType = oldRemindMe.type
  if(oldType === "specific_time" || oldType === "early") return oldRemindMe
  const remindStamp = thread.remindStamp
  if(!remindStamp) return
  const newRemindMe: LiuRemindMe = {
    type: "specific_time",
    specific_stamp: remindStamp
  }
  return newRemindMe
}