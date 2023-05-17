import type { TipTapEditor } from "~/types/types-editor"
import type { PropType } from "vue"

export interface ToolBarProps {
  isToolbarTranslateY: boolean
  canSubmit: boolean
  editor?: TipTapEditor
}

export const toolbarProps = {
  isToolbarTranslateY: Boolean,
  canSubmit: Boolean,
  editor: Object as PropType<TipTapEditor>,
}

export interface ToolBarEmits {
  (evt: "imagechange", files: File[]): void
  (evt: "filechange", files: File[]): void
}