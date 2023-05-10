import type { TipTapJSONContent, EditorCoreContent } from "~/types/types-editor"
import type { HashTagEditorRes } from "~/types/other/types-hashtag"


export type EditorCorePurpose = "thread-edit" | "thread-browse"
  | "comment-edit" | "comment-browse" | ""

export interface EditorCoreProps {
  titlePlaceholder: string
  descPlaceholder: string
  isEdit: boolean
  purpose: EditorCorePurpose
  content?: TipTapJSONContent
  hashTrigger: boolean            // 是否允许输入 # 来激发 cui.showHashTagEditor
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
  inlineCodeSize: string
  selectBg: string
  lineHeight: number
}