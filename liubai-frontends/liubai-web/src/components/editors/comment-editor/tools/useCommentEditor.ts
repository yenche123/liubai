import { useMyProfile } from "~/hooks/useCommon";
import EditorCore from "../../editor-core/editor-core.vue"
import { reactive, ref, shallowRef, watch } from "vue"
import type { Ref, ShallowRef } from "vue"
import type { TipTapEditor, EditorCoreContent } from "~/types/types-editor"
import type { CeCtx, CeProps, CommentStorageAtom } from "./types";
import { useWindowSize } from "~/hooks/useVueUse";
import { useLiuWatch } from "~/hooks/useLiuWatch";
import valTool from "~/utils/basic/val-tool";
import commentCache from "./comment-cache";
import time from "~/utils/basic/time";
import type { LiuFileStore, LiuImageStore } from "~/types";
import liuUtil from "~/utils/liu-util";
import { handleComment } from "./handle-comment"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";

export function useCommentEditor(props: CeProps) {

  let { located } = props

  // 上下文
  const ctx: CeCtx = reactive({
    focused: false,
    files: [],
    images: [],
    lastInitStamp: time.getTime(),
    lastFinishStamp: 0,
    isToolbarTranslateY: located === "main-view" || located === "vice-view",
    canSubmit: false,
    fileShowName: "",
  })
  
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

  // 监听图片改变，以缓存它们
  watch(() => ctx.images, (newImages) => {
    if(isJustInitOrFinish(ctx)) return
    const _newImages = liuUtil.toRawData(newImages)
    const atom = getStorageAtom(props, undefined, undefined, _newImages)
    commentCache.toSave(atom, "image")
    checkCanSubmit(ctx)
  }, { deep: true })

  // 监听文件改变，以缓存它们
  watch(() => ctx.files, (newFiles) => {
    handleFileName(ctx, newFiles)
    if(isJustInitOrFinish(ctx)) return
    const _newFiles = liuUtil.toRawData(newFiles)
    const atom = getStorageAtom(props, undefined, _newFiles, undefined)
    commentCache.toSave(atom, "file")
    checkCanSubmit(ctx)
  }, { deep: true })

  // 个人信息
  const { myProfile } = useMyProfile()

  const gs = useGlobalStateStore()

  /** 一些事件 */
  const onEditorFocus = () => {
    if(ctx.isToolbarTranslateY) {
      ctx.isToolbarTranslateY = false
    }
    ctx.focused = true
    gs.$patch({ commentEditorInputing: true })
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    ctx.focused = false
    gs.$patch({ commentEditorInputing: false })
  }

  const onEditorUpdate = (data: EditorCoreContent) => {
    let atom = getStorageAtom(props, data)
    commentCache.toSave(atom)
    ctx.editorContent = data
    checkCanSubmit(ctx)
  }

  const onEditorFinish = () => {
    checkCanSubmit(ctx)
    if(!ctx.canSubmit) return
    handleComment(props, ctx, editor)
  }


  return {
    ctx,
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
    editorContent,
    files,
    images,
  }
  return atom
}

function isJustInitOrFinish(ctx: CeCtx) {
  const s = ctx.lastInitStamp
  const now = time.getTime()
  const diff = now - s
  if(diff < 500) return true

  const s2 = ctx.lastFinishStamp
  const diff2 = now - s2
  if(diff2 < 300) return true

  return false
}


function initEditorContent(
  props: CeProps,
  ctx: CeCtx,
  editorRef: ShallowRef<TipTapEditor>
) {
  const editor = editorRef.value
  const oldText = editor.getText()
  if(oldText.trim()) return

  let atom = getStorageAtom(props)
  const res = commentCache.toGet(atom)
  const editorContent = res?.editorContent
  const images = res?.images
  const files = res?.files
  
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

function checkCanSubmit(
  ctx: CeCtx,
) {
  const imgLength = ctx.images.length
  const fileLength = ctx.files.length
  const text = ctx.editorContent?.text?.trim()

  let newCanSubmit = Boolean(imgLength) || Boolean(text) || Boolean(fileLength)
  ctx.canSubmit = newCanSubmit
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