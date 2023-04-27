import { useMyProfile } from "~/hooks/useCommon";
import EditorCore from "../../editor-core/editor-core.vue"
import { ref, shallowRef, onMounted, watch } from "vue"
import type { Ref } from "vue"
import type { TipTapEditor } from "~/types/types-editor"
import { CeProps } from "./types";
import { useWindowSize } from "~/hooks/useVueUse";
import { useLiuWatch } from "~/hooks/useLiuWatch";
import valTool from "~/utils/basic/val-tool";

export function useCommentEditor(props: CeProps) {
  
  // 编辑器相关
  const {
    maxEditorHeight,
    minEditorHeight,
  } = initEditorHeight(props)
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = shallowRef<TipTapEditor>()

  watch(editorCoreRef, (newV) => {
    if(!newV) return
    console.log("useCommentEditor editorCoreRef 发生变化.........")
    editor.value = newV.editor as TipTapEditor
  })


  // 个人信息
  const { myProfile } = useMyProfile()

  return {
    maxEditorHeight,
    minEditorHeight,
    editorCoreRef,
    editor,
    myProfile
  }
}


// 获取 maxEditorHeight 和 minEditorHeight
function initEditorHeight(props: CeProps) {
  const isCommentArea = props.located === "comment_area"
  const isPopup = props.located === "popup"
  let tmpMax = isCommentArea ? 50 : 250
  let tmpMin = isCommentArea ? 50 : 150

  const maxEditorHeight = ref(tmpMax)
  const minEditorHeight = ref(tmpMin)
  
  if(isPopup) {
    listenWindowChange(maxEditorHeight, minEditorHeight)
  }

  return {
    maxEditorHeight,
    minEditorHeight,
  }
}


// 当前位于弹窗内时，监听窗口高度变化
function listenWindowChange(
  maxEditorHeight: Ref<number>,
  minEditorHeight: Ref<number>,
) {
  const { height } = useWindowSize()

  const whenWindowHeightChange = () => {
    const h = height.value
    let min = valTool.numToFix(h / 7, 0)
    let max = valTool.numToFix(h / 3, 0)
    if(min < 100) min = 100
    if(max < 200) max = 200
    minEditorHeight.value = min
    maxEditorHeight.value = max
  }
  useLiuWatch(height, whenWindowHeightChange)
}