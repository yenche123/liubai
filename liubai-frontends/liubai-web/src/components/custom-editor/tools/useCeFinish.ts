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
import { LiuRemindMe } from "../../../types/types-atom";

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
  const calendarStamp = _getCalendarStamp(state.whenStamp, remindMe)
  const whenStamp = state.whenStamp ? liuUtil.formatStamp(state.whenStamp) : undefined
  const remindStamp = _getRemindStamp(remindMe, whenStamp)
  
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
    calendarStamp,
    remindStamp,
    whenStamp,
    remindMe,
    updatedStamp: now,
    editedStamp: now,
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
function toUpdate(ctx: CepContext) {

}

