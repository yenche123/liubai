import { useMyProfile } from "~/hooks/useCommon";
import EditorCore from "../../editor-core/editor-core.vue"
import { reactive, ref, shallowRef, watch } from "vue"
import type { Ref } from "vue"
import type { TipTapEditor, EditorCoreContent } from "~/types/types-editor"
import { CeCtx, CeProps } from "./types";
import { useWindowSize } from "~/hooks/useVueUse";
import { useLiuWatch } from "~/hooks/useLiuWatch";
import valTool from "~/utils/basic/val-tool";

export function useCommentEditor(props: CeProps) {

  let { located } = props

  // 上下文
  const ctx: CeCtx = reactive({
    focused: false,
    files: [],
    images: [],
    isToolbarTranslateY: located === "main-view" || located === "vice-view"
  })
  
  // 编辑器相关
  const {
    minEditorHeight,
  } = initEditorHeight(props)
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = shallowRef<TipTapEditor>()

  // 是否可允许点击发送
  const canSubmit = ref(false)

  watch(editorCoreRef, (newV) => {
    if(!newV) return
    editor.value = newV.editor as TipTapEditor
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


  return {
    ctx,
    minEditorHeight,
    editorCoreRef,
    editor,
    canSubmit,
    myProfile,
    onEditorFocus,
    onEditorBlur,
  }
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