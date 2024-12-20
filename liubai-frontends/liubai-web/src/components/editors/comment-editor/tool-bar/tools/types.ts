import type { TipTapEditor } from "~/types/types-editor"
import type { PropType } from "vue"
import type { LocatedA } from "~/types/other/types-custom";

export interface ToolBarProps {
  isToolbarTranslateY: boolean
  canSubmit: boolean
  editor?: TipTapEditor
  located?: LocatedA
  showSubmitBtn: boolean
  commentId?: string
}

export const toolbarProps = {
  isToolbarTranslateY: Boolean,
  canSubmit: Boolean,
  editor: Object as PropType<TipTapEditor>,
  located: String as PropType<LocatedA>,
  showSubmitBtn: {
    type: Boolean,
    default: true,
  },
  commentId: String
}

export interface ToolBarEmits {
  (evt: "imagechange", files: File[]): void
  (evt: "filechange", files: File[]): void
  (evt: "tapfinish"): void
}