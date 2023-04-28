import { useMyProfile } from "~/hooks/useCommon";
import EditorCore from "../../editor-core/editor-core.vue"
import { ref, shallowRef, watch } from "vue"
import type { Ref } from "vue"
import type { TipTapEditor } from "~/types/types-editor"
import { CeProps } from "./types";
import { useWindowSize } from "~/hooks/useVueUse";
import { useLiuWatch } from "~/hooks/useLiuWatch";
import valTool from "~/utils/basic/val-tool";

export function useCommentEditor(props: CeProps) {
  
  // 编辑器相关
  const {
    minEditorHeight,
  } = initEditorHeight(props)
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = shallowRef<TipTapEditor>()

  // toolbar 是否上移、缩小空间
  const isToolbarTranslateY = ref(props.located === "comment_area")

  // 是否可允许点击发送
  const canSubmit = ref(false)

  watch(editorCoreRef, (newV) => {
    if(!newV) return
    console.log("useCommentEditor editorCoreRef 发生变化.........")
    editor.value = newV.editor as TipTapEditor
  })


  // 个人信息
  const { myProfile } = useMyProfile()


  // 一些事件
  const onEditorFocus = () => {
    if(isToolbarTranslateY.value) {
      isToolbarTranslateY.value = false
    }
  }


  return {
    minEditorHeight,
    editorCoreRef,
    editor,
    isToolbarTranslateY,
    canSubmit,
    myProfile,
    onEditorFocus,
  }
}


// 获取 minEditorHeight
function initEditorHeight(props: CeProps) {
  const isCommentArea = props.located === "comment_area"
  const isPopup = props.located === "popup"
  let tmpMin = isCommentArea ? 48 : 150

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