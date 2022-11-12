// 初始化 编辑器上的文本
// 仅从本地缓存上寻找！


import { TipTapEditor } from "../../../types/types-editor"
import { computed, reactive, watchEffect, ref, provide } from "vue"
import type { ShallowRef, ComputedRef, Ref } from "vue"
import type { CeState } from "./types-ce"
import { ContentLocalTable, DraftLocalTable } from "../../../types/types-table"
import { LiuRemindMe } from "../../../types/types-atom"
import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore"
import localReq from "./req/local-req"
import transferUtil from "../../../utils/transfer-util"
import { editorSetKey } from "../../../utils/provide-keys"

let space: ComputedRef<string>

interface IcsContext {
  state: CeState
  editor: TipTapEditor
  numWhenSet: Ref<number>
}

export function initCeState(
  props: { threadId?: string },
  editor: ShallowRef<TipTapEditor | undefined>,
) {

  const spaceStore = useWorkspaceStore()  
  space = computed(() => {
    if(!spaceStore.isCollaborative) return "ME"
    return spaceStore.spaceId
  })

  const tId = props.threadId
  
  // 不能用 shallowReactive 
  // 因为 images 属性必须监听内部数据的变化
  let state = reactive<CeState>({
    infoType: "THREAD",
    visScope: "DEFAULT",
    storageState: "CLOUD",
    threadEdited: tId
  })
  
  const numWhenSet = ref(0)
  provide(editorSetKey, numWhenSet)

  watchEffect(() => {
    const editorVal = editor.value
    const spaceVal = space.value
    if(!editorVal || !spaceVal) return
    const ctx: IcsContext = {
      state,
      editor: editorVal,
      numWhenSet,
    }
    initDraft(ctx, tId)
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

    draft = await localReq.getDraftByThreadId(threadId, space.value)
    let thread = await localReq.getThreadByThreadId(threadId, space.value)

    if(!draft && !thread) return
    
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
    draft = await localReq.getDraft(space.value)
    if(draft) initDraftFromDraft(ctx, draft)
    return
  }
}

// 尚未发表
async function initDraftFromDraft(
  ctx: IcsContext,
  draft: DraftLocalTable,
) {
  let { state, editor, numWhenSet } = ctx

  // 开始处理 draft 有值的情况
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
  
  if(draft.liuDesc) {
    editor.commands.setContent({ type: "doc", content: draft.liuDesc })
    state.descInited = draft.liuDesc
    numWhenSet.value++
  }
}

async function initDraftFromThread(
  ctx: IcsContext,
  thread: ContentLocalTable,
) {
  let { state, editor, numWhenSet } = ctx
  state.visScope = thread.visScope
  state.storageState = thread.storageState
  state.title = thread.title
  state.whenStamp = thread.whenStamp
  state.remindMe = _getRemindMeFromThread(thread)
  state.images = thread.images
  state.files = thread.files

  if(thread.liuDesc) {
    let draftDesc = transferUtil.liuToTiptap(thread.liuDesc)
    editor.commands.setContent({ type: "doc", content: draftDesc })
    state.descInited = draftDesc
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