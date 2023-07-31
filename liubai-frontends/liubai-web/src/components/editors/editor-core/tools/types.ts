import type { TipTapJSONContent, EditorCoreContent } from "~/types/types-editor"
import type { HashTagEditorRes } from "~/types/other/types-hashtag"
import type { PropType } from "vue"
import cfg from "~/config"

export type EditorCorePurpose = "thread-edit" | "thread-browse"
  | "comment-edit" | "comment-browse" | ""

export interface EditorCoreProps {
  titlePlaceholder: string
  descPlaceholder: string
  isEdit: boolean
  content?: TipTapJSONContent
  hashTrigger: boolean            // 是否允许输入 # 来激发 cui.showHashTagEditor
  minHeight: string
  purpose: EditorCorePurpose
}

export const editorCoreProps = {
  titlePlaceholder: {
    type: String,
    default: "",
  },
  descPlaceholder: {
    type: String,
    default: "",
  },
  isEdit: {         // 是否为编辑模式
    type: Boolean,
    default: true
  },
  content: {
    type: Object as PropType<TipTapJSONContent>
  },
  hashTrigger: {
    type: Boolean,
    default: false,
  },
  minHeight: {
    type: String,
    default: `${cfg.min_editor_height}px`
  },
  purpose: {
    type: String as PropType<EditorCorePurpose>,
    default: ""
  }
}

export interface EditorCoreEmits {
  (event: "update", data: EditorCoreContent): void
  (event: "focus", data: EditorCoreContent): void
  (event: "blur", data: EditorCoreContent): void
  (event: "finish", data: EditorCoreContent): void
  (event: "addhashtag", data: HashTagEditorRes): void
}

export interface EditorCoreStyles {
  fontSize: string
  h1Size: string
  inlineCodeSize: string
  selectBg: string
  lineHeight: number
}