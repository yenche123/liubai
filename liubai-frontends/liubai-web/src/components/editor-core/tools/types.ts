import type { TipTapJSONContent, EditorCoreContent } from "~/types/types-editor"
import type { HashTagEditorRes } from "~/types/other/types-hashtag"

export interface EditorCoreProps {
  titlePlaceholder: string
  descPlaceholder: string
  editMode: boolean
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
