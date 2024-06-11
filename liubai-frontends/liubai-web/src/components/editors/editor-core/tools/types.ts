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
  hashTrigger: boolean            // 是否允许输入 # 来激发 cui.showHashtagEditor
  minHeight: string
  purpose: EditorCorePurpose
  isInCard: boolean              // 在浅色模式时，是否在背景为白色的卡片里
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
  },
  isInCard: {
    type: Boolean,
    default: true,
  }
}

export interface EcSelectionChangeData {
  empty: boolean
}

export interface EditorCoreEmits {
  (evt: "update", data: EditorCoreContent): void
  (evt: "focus", data: EditorCoreContent): void
  (evt: "blur", data: EditorCoreContent): void
  (evt: "finish", data: EditorCoreContent): void
  (evt: "addhashtag", data: HashTagEditorRes): void
  (evt: "selectionchange", data: EcSelectionChangeData): void
}

export interface EditorCoreStyles {
  fontSize: string
  h1Size: string
  inlineCodeSize: string
  selectBg: string
  lineHeight: number
  hrBg: string
}