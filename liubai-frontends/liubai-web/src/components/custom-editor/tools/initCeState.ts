// 初始化 编辑器上的文本
// 仅从本地缓存上寻找！


import { TipTapEditor } from "../../../types/types-editor"
import { computed, reactive, watchEffect } from "vue"
import type { ShallowRef, ComputedRef } from "vue"
import type { CeState } from "./types-ce"
import { ContentLocalTable, DraftLocalTable } from "../../../types/types-table"
import { LiuRemindMe } from "../../../types/types-atom"
import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore"
import localReq from "./req/local-req"
import transferUtil from "../../../utils/transfer-util"

let space: ComputedRef<string>

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
  
  let state = reactive<CeState>({
    infoType: "THREAD",
    visScope: "DEFAULT",
    storageState: "CLOUD",
    threadEdited: tId
  })

  watchEffect(() => {
    const editorVal = editor.value
    const spaceVal = space.value
    if(editorVal && spaceVal) {
      initDraft(state, editorVal, tId)
    }
  })

  return { state }
}

// spaceId 有值的周期内，本地的 user_id 肯定存在了
async function initDraft(
  state: CeState,
  editor: TipTapEditor,
  threadId?: string,
) {
  let res = await initDraftFromDraft(state, editor, threadId)
  if(res) return
  if(threadId) initDraftFromThread(state, editor, threadId)
}

// 尚未发表
async function initDraftFromDraft(
  state: CeState,
  editor: TipTapEditor,
  threadId?: string
) {
  let draft: DraftLocalTable | null = null
  if(threadId) {
    draft = await localReq.getDraftByThreadId(threadId, space.value)
  }
  else {
    draft = await localReq.getDraft(space.value)
  }

  if(!draft) return false

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
  
  if(draft.liuDesc) {
    editor.commands.setContent({ type: "doc", content: draft.liuDesc })
  }
  return true
}

async function initDraftFromThread(
  state: CeState,
  editor: TipTapEditor,
  threadId: string
) {
  let thread = await localReq.getThreadByThreadId(threadId, space.value)
  if(!thread) return

  state.visScope = thread.visScope
  state.storageState = thread.storageState
  state.title = thread.title
  state.whenStamp = thread.whenStamp
  state.remindMe = _getRemindMeFromThread(thread)
  state.images = thread.images

  if(thread.liuDesc) {
    let draftDesc = transferUtil.liuToTiptap(thread.liuDesc)
    editor.commands.setContent({ type: "doc", content: draftDesc })
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