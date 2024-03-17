import { useMyProfile } from "~/hooks/useCommon";
import EditorCore from "../../editor-core/editor-core.vue"
import { computed, reactive, ref, shallowRef, watch } from "vue"
import type { Ref, ShallowRef } from "vue"
import type { TipTapEditor, EditorCoreContent } from "~/types/types-editor"
import type { CeCtx, CeProps, CeEmit, CommentStorageAtom } from "./types";
import { useWindowSize } from "~/hooks/useVueUse";
import { useLiuWatch } from "~/hooks/useLiuWatch";
import valTool from "~/utils/basic/val-tool";
import commentCache from "./comment-cache";
import time from "~/utils/basic/time";
import type { LiuFileStore, LiuImageStore } from "~/types";
import liuUtil from "~/utils/liu-util";
import { handleComment } from "./handle-comment"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import type { LiuTimeout } from "~/utils/basic/type-tool";
import localReq from "./req/local-req";
import transferUtil from "~/utils/transfer-util";
import usefulTool from "~/utils/basic/useful-tool";

export function useCommentEditor(
  props: CeProps,
  emit: CeEmit,
) {

  let { located } = props

  const placeholderKey = computed(() => {
    const r = props.replyToComment
    if(r) return `comment.placeholder2`
    return `comment.placeholder1`
  })

  // 上下文
  const ctx = reactive<CeCtx>({
    focused: false,
    files: [],
    images: [],
    lastInitStamp: time.getTime(),
    lastFinishStamp: 0,
    isToolbarTranslateY: located === "main-view" || located === "vice-view",
    canSubmit: false,
    fileShowName: "",
    releasedData: {},
  })

  watch(() => ctx.canSubmit, (newV) => emit("cansubmit", newV))
  
  // 编辑器相关
  const {
    minEditorHeight,
  } = initEditorHeight(props)
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = shallowRef<TipTapEditor>()
  watch(editorCoreRef, (newV) => {
    if(!newV) return
    editor.value = newV.editor as TipTapEditor
    initEditorContent(props, ctx, editor as ShallowRef<TipTapEditor>)
  })

  // 监听上级组件要求聚焦
  watch(() => props.focusNum, (newV) => {
    if(newV <= 0) return
    const eVal = editor.value
    if(!eVal) return
    eVal.commands.focus()
  })

  // 监听图片改变，以缓存它们
  watch(() => ctx.images, (newImages) => {
    if(isJustInitOrFinish(ctx)) return
    const _newImages = liuUtil.toRawData(newImages)
    const atom = getStorageAtom(props, undefined, undefined, _newImages)
    commentCache.toSave(atom, "image")
    checkCanSubmit(props, ctx)
  }, { deep: true })

  // 监听文件改变，以缓存它们
  watch(() => ctx.files, (newFiles) => {
    handleFileName(ctx, newFiles)
    if(isJustInitOrFinish(ctx)) return
    const _newFiles = liuUtil.toRawData(newFiles)
    const atom = getStorageAtom(props, undefined, _newFiles, undefined)
    commentCache.toSave(atom, "file")
    checkCanSubmit(props, ctx)
  }, { deep: true })

  // 个人信息
  const { myProfile } = useMyProfile()

  const gs = useGlobalStateStore()

  /** 一些事件 */
  let timeout: LiuTimeout

  // 必须做防抖节流，因为黏贴事件会触发 onEditorBlur 之后又马上聚焦，触发了 onEditorFocus
  // 所以做一层防抖节流能让 “黏贴事件” 知道理想上当前应该是何种聚焦状态
  const _setFocus = (newV: boolean) => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      ctx.focused = newV
      gs.$patch({ commentEditorInputing: newV })
    }, 120)
  }

  const onEditorFocus = () => {
    if(ctx.isToolbarTranslateY) {
      ctx.isToolbarTranslateY = false
    }
    _setFocus(true)
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    _setFocus(false)
  }

  const onEditorUpdate = (data: EditorCoreContent) => {
    let atom = getStorageAtom(props, data)
    commentCache.toSave(atom)
    ctx.editorContent = data
    checkCanSubmit(props, ctx)
  }

  const onEditorFinish = () => {
    checkCanSubmit(props, ctx)
    if(!ctx.canSubmit) return
    handleComment(props, emit, ctx, editor)
  }

  watch(() => props.submitNum, (newV) => {
    if(newV) onEditorFinish()
  })

  return {
    ctx,
    placeholderKey,
    minEditorHeight,
    editorCoreRef,
    editor,
    myProfile,
    onEditorFocus,
    onEditorBlur,
    onEditorUpdate,
    onEditorFinish,
  }
}

function handleFileName(
  ctx: CeCtx,
  files: LiuFileStore[]
) {
  let firFile = files[0]
  if(!firFile) {
    ctx.fileShowName = ""
    return
  }
  ctx.fileShowName = liuUtil.trim.trimFileName(firFile.name)
}


export function getStorageAtom(
  props: CeProps,
  editorContent?: EditorCoreContent,
  files?: LiuFileStore[],
  images?: LiuImageStore[],
) {
  let atom: CommentStorageAtom = {
    parentThread: props.parentThread,
    parentComment: props.parentComment,
    replyToComment: props.replyToComment,
    commentId: props.commentId,
    editorContent,
    files,
    images,
  }
  return atom
}

function isJustInitOrFinish(ctx: CeCtx) {
  const s = ctx.lastInitStamp
  if(time.isWithinMillis(s, 500)) return true

  const s2 = ctx.lastFinishStamp
  if(time.isWithinMillis(s2, 300)) return true

  return false
}


function initEditorContent(
  props: CeProps,
  ctx: CeCtx,
  editorRef: ShallowRef<TipTapEditor>
) {
  const editor = editorRef.value
  const oldText = editor.getText()
  if(oldText.trim()) {
    return
  }
  
  let atom = getStorageAtom(props)
  const res = commentCache.toGet(atom)
  const editorContent = res?.editorContent
  const images = res?.images
  const files = res?.files

  if(!res && props.commentId) {
    initEditorContentFromDB(props, ctx, editor)
    return
  }
  
  if(editorContent?.text?.trim()) {
    editor.commands.setContent(editorContent.json)
    ctx.editorContent = editorContent
    ctx.isToolbarTranslateY = false
    ctx.canSubmit = true
  }

  if(images?.length) {
    ctx.images = images
    ctx.isToolbarTranslateY = false
    ctx.canSubmit = true
  }
  if(files?.length) {
    ctx.files = files
    ctx.isToolbarTranslateY = false
    ctx.canSubmit = true
  }
}


async function initEditorContentFromDB(
  props: CeProps,
  ctx: CeCtx,
  editor: TipTapEditor,
) {
  const commentId = props.commentId as string
  const res = await localReq.getContent(commentId)
  if(!res) return

  const { images, files } = res

  // 由于是 "已发表后的编辑" 态，canSubmit 默认为 false
  ctx.canSubmit = false
  ctx.releasedData = {}

  if(res.liuDesc?.length) {
    const content = transferUtil.liuToTiptap(res.liuDesc)
    const text = transferUtil.tiptapToText(content)
    const json = { type: "doc", content }

    editor.commands.setContent(json)
    ctx.editorContent = { text, json }
    ctx.isToolbarTranslateY = false
    ctx.releasedData.text = text.trim()
  }

  if(images?.length) {
    ctx.images = images
    ctx.isToolbarTranslateY = false
    ctx.releasedData.images = valTool.copyObject(images)
  }
  if(files?.length) {
    ctx.files = files
    ctx.isToolbarTranslateY = false
    ctx.releasedData.files = valTool.copyObject(files)
  }
}


function checkCanSubmit(
  props: CeProps,
  ctx: CeCtx,
) {
  const imgLength = ctx.images.length
  const fileLength = ctx.files.length  
  const text = ctx.editorContent?.text?.trim()

  let newCanSubmit = Boolean(imgLength) || Boolean(text) || Boolean(fileLength)

  if(props.commentId) {
    let hasChanged = checkIfSomethingChanged(ctx)
    if(!hasChanged) {
      ctx.canSubmit = false
      return
    }
  }

  ctx.canSubmit = newCanSubmit
}


function checkIfSomethingChanged(
  ctx: CeCtx,
) {
  const { releasedData: rd } = ctx
  const text = ctx.editorContent?.text?.trim()
  if(rd.text !== text) {
    return true
  }

  const areImgsTheSame = usefulTool.checkIdsInLists(ctx.images, rd.images ?? [])
  if(!areImgsTheSame) {
    return true
  }

  const areFilesTheSame = usefulTool.checkIdsInLists(ctx.files, rd.files ?? [])
  if(!areFilesTheSame) {
    return true
  }

  return false
}


// 获取 minEditorHeight
function initEditorHeight(props: CeProps) {
  let { located } = props
  const isCommentArea = located === "main-view" || located === "vice-view"
  const isPopup = located === "popup"
  let tmpMin = isCommentArea ? 38 : 150

  const minEditorHeight = ref(tmpMin)
  
  if(isPopup) {
    listenWindowChange(minEditorHeight)
  }

  return {
    minEditorHeight,
  }
}


// 当前位于弹窗内时，监听窗口高度变化
function listenWindowChange(
  minEditorHeight: Ref<number>,
) {
  const { height } = useWindowSize()

  const whenWindowHeightChange = () => {
    const h = height.value
    let min = valTool.numToFix(h / 7, 0)
    if(min < 100) min = 100
    minEditorHeight.value = min
  }

  useLiuWatch(height, whenWindowHeightChange)
}