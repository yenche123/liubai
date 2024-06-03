
import { ref, watch, computed, toRef } from "vue";
import type { Ref, ShallowRef } from "vue";
import type { 
  EditorCoreContent, 
  TipTapEditor, 
  TipTapJSONContent,
} from "~/types/types-editor";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import type { LiuRemindMe } from "~/types/types-atom";
import type { CeData, CeProps, CeEmits } from "./types";
import ider from "~/utils/basic/ider";
import type { DraftLocalTable } from "~/types/types-table";
import localCache from "~/utils/system/local-cache";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import time from "~/utils/basic/time";
import localReq from "./req/local-req";
import type { LiuFileStore, LiuImageStore } from "~/types";
import type { CepToPost } from "./useCeFinish"
import liuUtil from "~/utils/liu-util";
import { storeToRefs } from "pinia";
import type { OState_Draft, SpaceType } from "~/types/types-basic"
import type { LiuTimeout } from "~/utils/basic/type-tool";
import { handleOverflow } from "./handle-overflow";
import liuApi from "~/utils/liu-api";
import { LocalToCloud } from "~/utils/cloud/LocalToCloud";

let collectTimeout: LiuTimeout
let spaceIdRef: Ref<string>
let spaceTypeRef: Ref<SpaceType>

const SEC_5 = time.SECONED * 5

interface CesCtx {
  ceData: CeData
  emits: CeEmits
}

export function useCeData(
  props: CeProps,
  emits: CeEmits,
  ceData: CeData,
  toFinish: CepToPost,
  editor: ShallowRef<TipTapEditor | undefined>,
) {

  const ctx: CesCtx = { ceData, emits }
  const wStore = useWorkspaceStore()
  const wRefs = storeToRefs(wStore)
  spaceIdRef = wRefs.spaceId
  spaceTypeRef = wRefs.spaceType as Ref<SpaceType>

  // 监听用户操作 images 的变化，去存储到 IndexedDB 上
  watch(() => ceData.images, (newV) => {
    toAutoChange(ctx)
    checkCanSubmit(ceData)
  }, { deep: true })

  // 监听用户操作 files 的变化，去存储到 IndexedDB 上
  watch(() => ceData.files, (newV) => {
    toAutoChange(ctx)
    checkCanSubmit(ceData)
  }, { deep: true })

  // 监听 tagIds 的变化
  watch(() => ceData.tagIds, (newV) => {
    toAutoChange(ctx)
  }, { deep: true })
  
  const titleFocused = ref(false)
  const descFocused = ref(false)
  const gs = useGlobalStateStore()
  let timeout: LiuTimeout

  const anyFocused = computed(() => {
    const val = titleFocused.value || descFocused.value
    return val
  })

  const _setFocus = (newV: boolean) => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      descFocused.value = newV
      gs.$patch({ customEditorInputing: newV })
    }, 60)
  }

  const onEditorFocus = (data: EditorCoreContent) => {
    ceData.editorContent = data
    _setFocus(true)
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    ceData.editorContent = data
    _setFocus(false)
  } 

  const onEditorUpdate = (data: EditorCoreContent) => {
    ceData.editorContent = data
    checkCanSubmit(ceData)
    handleOverflow(ceData)
    toAutoChange(ctx)
  }

  let lastPreFinish = 0
  const _prepareFinish = (focusRequired: boolean) => {
    lastPreFinish = time.getTime()
    if(collectTimeout) clearTimeout(collectTimeout)
    toFinish(focusRequired)
  }

  const onEditorFinish = (data: EditorCoreContent) => {
    ceData.editorContent = data
    checkCanSubmit(ceData)
    _prepareFinish(true)
  }

  const onWhenChange = (date: Date | null) => {
    toWhenChange(date, ctx)
  }

  const onRemindMeChange = (val: LiuRemindMe | null) => {
    toRemindMeChange(val, ctx)
  }

  const onTitleChange = (val: string) => {
    toTitleChange(val, ctx)
    checkCanSubmit(ceData)
  }

  const onSyncCloudChange = (val: boolean) => {
    toSyncCloudChange(val, ctx)
  }

  const onTapFinish = () => {
    _prepareFinish(false)
  }

  const onTapCloseTitle = () => {
    ceData.showTitleBar = false
    toTitleChange("", ctx)
    checkCanSubmit(ceData)
  }

  const onTitleBarChange = (e: Event) => {
    //@ts-expect-error
    const val = e.target.value
    if(typeof val !== "string") return
    ceData.title = val
    collectState(ctx)
    checkCanSubmit(ceData)
  }

  const onTitleEnterUp = () => {
    // 若前一刻准备去执行 “完成” 的流程，就阻断
    if(time.isWithinMillis(lastPreFinish, 500)) return
    
    const e = editor.value
    if(!e) return
    e.commands.focus()
    descFocused.value = true
  }

  const { isMac } = liuApi.getCharacteristic()
  const onTitleEnterDown = (e: KeyboardEvent) => {
    const { ctrlKey, metaKey } = e
    let res = false
    if(ctrlKey && !isMac) res = true
    else if(metaKey && isMac) res = true
    
    if(res) {
      checkCanSubmit(ceData)
      _prepareFinish(true)
    }
  }

  // 监听 props.forceUpdateNum
  const forceUpdateNum = toRef(props, "forceUpdateNum")
  watch(forceUpdateNum, (newV, oldV) => {
    if(!newV) return
    if(newV > oldV) {
      checkCanSubmit(ceData)
      _prepareFinish(false)
    }
  })
  
  return {
    titleFocused,
    anyFocused,
    onEditorFocus,
    onEditorBlur,
    onEditorUpdate,
    onEditorFinish,
    onWhenChange,
    onRemindMeChange,
    onTitleChange,
    onSyncCloudChange,
    onTapFinish,
    onTapCloseTitle,
    onTitleBarChange,
    onTitleEnterUp,
    onTitleEnterDown,
  }
}

function _isRequiredChange(ceData: CeData) {
  // 刚刚才 setup，拒绝缓存图片、文件、tagIds
  if(time.isWithinMillis(ceData.lastLockStamp ?? 1, 900)) {
    return false
  }

  return true
}

// 内文、图片、文件、tagIds 发生变化时，去保存
function toAutoChange(
  ctx: CesCtx, 
  instant: boolean = false,
) {
  if(_isRequiredChange(ctx.ceData)) {
    collectState(ctx, instant)
  }
}


function checkCanSubmit(
  ceData: CeData,
) {
  const title = ceData.title?.trim()
  const imgLength = ceData.images?.length
  const fileLength = ceData.files?.length
  const text = ceData.editorContent?.text.trim()
  let newCanSubmit = Boolean(imgLength) || Boolean(text) || Boolean(fileLength)
  newCanSubmit = newCanSubmit || Boolean(title)
  ceData.canSubmit = newCanSubmit
}


function toWhenChange(
  date: Date | null,
  ctx: CesCtx,
) {
  const newWhenStamp = date ? date.getTime() : undefined
  if(newWhenStamp === ctx.ceData.whenStamp) {
    return
  }

  ctx.ceData.whenStamp = newWhenStamp
  collectState(ctx)
}

function toRemindMeChange(
  val: LiuRemindMe | null,
  ctx: CesCtx,
) {
  ctx.ceData.remindMe = val ? val : undefined
  collectState(ctx)
}

function toTitleChange(
  val: string,
  ctx: CesCtx,
) {
  const oldVal = ctx.ceData.title
  if(val === oldVal) return
  ctx.ceData.title = val
  if(val && !ctx.ceData.showTitleBar) {
    ctx.ceData.showTitleBar = true
  }
  collectState(ctx, true)
}

function toSyncCloudChange(
  val: boolean,
  ctx: CesCtx,
) {
  ctx.ceData.storageState = val ? "CLOUD" : "LOCAL"
  collectState(ctx, true)
}


let lastSaveStamp = 0
/****************** 收集信息、缓存 ***************/
function collectState(ctx: CesCtx, instant: boolean = false) {
  if(collectTimeout) clearTimeout(collectTimeout)
  if(instant) {
    toSave(ctx)
    return
  }

  // 判断缓存间隔，超过 5s 没有存储过，就缩短防抖节流的阈值
  if(!lastSaveStamp) lastSaveStamp = time.getTime()
  const now = time.getTime()
  const diff = now - lastSaveStamp
  const duration = diff > SEC_5 ? 250 : 2500
  collectTimeout = setTimeout(() => {
    toSave(ctx)
  }, duration)
}

async function toSave(ctx: CesCtx) {
  const { ceData } = ctx
  const now = time.getTime()
  lastSaveStamp = now

  let insertedStamp = now
  let _id = ider.createDraftId()
  let first_id = _id
  let oState: OState_Draft = "OK"
  let oldOState: OState_Draft | undefined
  if(ceData.draftId) {
    _id = ceData.draftId
    const tmp = await localReq.getDraftById(ceData.draftId)
    if(tmp) {
      insertedStamp = tmp.insertedStamp
      first_id = tmp.first_id
      oState = tmp.oState
      oldOState = tmp.oState
    }
  }

  const { local_id: userId } = localCache.getPreference()
  let liuDesc: TipTapJSONContent[] | undefined = undefined
  if(ceData.editorContent?.json) {
    const { type, content } = ceData.editorContent.json
    if(type === "doc" && content) liuDesc = content
  }

  // 响应式对象 转为普通对象
  liuDesc = liuUtil.toRawData(liuDesc)
  let images = _getStoragedFiles(ceData)
  let files = _getStoragedFiles<LiuFileStore>(ceData, "files")
  let remindMe = liuUtil.toRawData(ceData.remindMe)
  let tagIds = liuUtil.toRawData(ceData.tagIds)

  // checking out oState for local situation
  const ss = ceData.storageState
  const needLocal = liuUtil.check.isLocalContent(ss)
  if(oState === "OK" && needLocal) {
    oState = "LOCAL"  
  }
  else if(oState === "LOCAL" && !needLocal) {
    oState = "OK"
  }

  const draft: DraftLocalTable = {
    _id,
    first_id,
    infoType: "THREAD",
    oState,
    user: userId as string,
    spaceId: spaceIdRef.value,
    spaceType: spaceTypeRef.value,
    threadEdited: ceData.threadEdited,
    visScope: ceData.visScope,
    storageState: ss,
    title: ceData.title,
    liuDesc,
    images,
    files,
    whenStamp: ceData.whenStamp,
    remindMe,
    insertedStamp: insertedStamp,
    updatedStamp: now,
    editedStamp: now,
    tagIds,
  }

  console.log("去本地存储 draft.........")
  console.log(draft)
  console.log(" ")

  const res = await localReq.setDraft(draft)
  if(!ceData.draftId && res) ceData.draftId = res as string
  saveDraftToCloud(oldOState, draft)

  // make parent component aware that user has been editing the editor
  ctx.emits("editing")
}

function saveDraftToCloud(
  oldOState: OState_Draft | undefined,
  d: DraftLocalTable,
) {
  const newOState = d.oState

  // 1. draft-set if oState is OK
  if(newOState === "OK") {
    LocalToCloud.addTask({
      uploadTask: "draft-set",
      target_id: d._id,
      operateStamp: d.editedStamp,
    }, true)
    return
  }

  // 2. check out if the draft need to be cleared
  const synced = liuUtil.check.hasEverSynced(d)
  if(!synced) return
  if(oldOState !== "LOCAL" && newOState === "LOCAL") {
    console.log("clear draft on cloud......")
    LocalToCloud.addTask({
      uploadTask: "draft-clear",
      target_id: d._id,
      operateStamp: d.editedStamp,
    })
  }
}



function _getStoragedFiles<T = LiuImageStore>(
  ceData: CeData, 
  key: keyof CeData = "images"
): T[] | undefined {
  const files = ceData[key] as (T[] | undefined)
  if(!files) return
  const newList = liuUtil.getRawList(files)
  return newList
}