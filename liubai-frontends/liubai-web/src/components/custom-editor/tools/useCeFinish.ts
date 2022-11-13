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

// 本文件处理发表的逻辑

export interface CepContext {
  canSubmitRef: Ref<boolean>
  editor: ShallowRef<TipTapEditor | undefined>
  state: CeState
}

export type CepToPost = () => void

let space: ComputedRef<string>

export function useCeFinish(ctx: CepContext) {

  const spaceStore = useWorkspaceStore()  
  space = computed(() => {
    if(!spaceStore.isCollaborative) return "ME"
    return spaceStore.spaceId
  })


  const toFinish: CepToPost = () => {
    if(!ctx.canSubmitRef.value) return
    const { threadEdited } = ctx.state
    if(threadEdited) toUpdate(ctx)
    else toRelease(ctx)
  }

  return { toFinish }
}

// 去发表
function toRelease(ctx: CepContext) {
  const preThread = _getThreadData(ctx.state)
  if(!preThread) return

}


// 只有 _id / createdStamp / insertedStamp 没有被添加进 state
function _getThreadData(
  state: CeState,
) {
  const { local_id: user } = getLocalPreference()
  if(!user) return
  const now = time.getTime()
  const { editorContent } = state
  const contentJSON = editorContent?.json
  const list = contentJSON?.type === "doc" && contentJSON.content ? contentJSON.content : []
  const liuDesc =  list.length > 0 ? transferUtil.tiptapToLiu(list) : undefined

  const images = liuUtil.getRawList(state.images)
  const files = liuUtil.getRawList(state.files)
  const remindMe = liuUtil.toRawData(state.remindMe)
  
  const aThread: Partial<ContentLocalTable> = {
    infoType: "THREAD",
    oState: "OK",
    user,
    workspace: space.value,
    visScope: state.visScope,
    storageState: state.storageState,
    title: state.title,
    liuDesc,
    images,
    files,

    // calendarStamp 待完善
    // remindStamp   待完善

    whenStamp: state.whenStamp,
    remindMe,
    updatedStamp: now,
    editedStamp: now,
  }

  return aThread
}



// 去更新
function toUpdate(ctx: CepContext) {

}

