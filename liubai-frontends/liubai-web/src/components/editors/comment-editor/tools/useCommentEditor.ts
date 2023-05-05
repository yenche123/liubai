import { useMyProfile } from "~/hooks/useCommon";
import EditorCore from "../../editor-core/editor-core.vue"
import { reactive, ref, shallowRef, watch } from "vue"
import type { Ref, ShallowRef } from "vue"
import type { TipTapEditor, EditorCoreContent } from "~/types/types-editor"
import { CeCtx, CeProps, CommentStorageAtom } from "./types";
import { useWindowSize } from "~/hooks/useVueUse";
import { useLiuWatch } from "~/hooks/useLiuWatch";
import valTool from "~/utils/basic/val-tool";
import commentCache from "./comment-cache";
import time from "~/utils/basic/time";

export function useCommentEditor(props: CeProps) {

  let { located } = props

  // 上下文
  const ctx: CeCtx = reactive({
    focused: false,
    files: [],
    images: [],
    lastInitStamp: time.getTime(),
    isToolbarTranslateY: located === "main-view" || located === "vice-view",
    canSubmit: false,
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


  // 个人信息
  const { myProfile } = useMyProfile()


  /** 一些事件 */
  const onEditorFocus = () => {
    if(ctx.isToolbarTranslateY) {
      ctx.isToolbarTranslateY = false
    }
    ctx.focused = true
  }

  const onEditorBlur = (data: EditorCoreContent) => {
    ctx.focused = false
  }

  const onEditorUpdate = (data: EditorCoreContent) => {
    let atom = getStorageAtom(props, data)
    commentCache.toSave(atom)
    ctx.editorContent = data
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
  }
}


function getStorageAtom(
  props: CeProps,
  editorContent?: EditorCoreContent,
) {
  let atom: CommentStorageAtom = {
    parentThread: props.parentThread,
    parentComment: props.parentComment,
    replyToComment: props.replyToComment,
    editorContent,
  }
  return atom
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
  if(!editorContent) return
  if(!editorContent.text) return

  editor.commands.setContent(editorContent.json)
  ctx.editorContent = editorContent
  ctx.isToolbarTranslateY = false

  checkCanSubmit(ctx)
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
  let tmpMin = isCommentArea ? 42 : 150

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