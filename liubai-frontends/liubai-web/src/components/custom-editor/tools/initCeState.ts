// 初始化 编辑器上的文本
// 仅从本地缓存上寻找！


import { TipTapEditor } from "../../../types/types-editor"
import { computed, reactive, watchEffect } from "vue"
import type { ShallowRef, ComputedRef } from "vue"
import type { CeState } from "./types-ce"
import { DraftLocalTable } from "../../../types/types-table"
import { LiuContent } from "../../../types/types-atom"
import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore"
import localReq from "./req/local-req"

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
  
  let state = reactive<CeState>({
    infoType: "THREAD",
    visScope: "DEFAULT",
    storageState: "CLOUD",
  })

  watchEffect(() => {
    const editorVal = editor.value
    const spaceVal = space.value
    if(editorVal && spaceVal) {
      initDraft(state, editor, props.threadId)
    }
  })

  return { state }
}

// spaceId 有值的周期内，本地的 user_id 肯定存在了
async function initDraft(
  state: CeState,
  editor: ShallowRef<TipTapEditor | undefined>,
  threadId?: string,
) {
  let draft: DraftLocalTable | null = null

  if(threadId) {
    // 编辑时
    
  }
  else {
    // 发表时
    draft = await localReq.getDraft(space.value)
  }

  if(!draft) return
  // 开始处理 draft 有值的情况
  

}