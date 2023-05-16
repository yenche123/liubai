


export interface ToolBarProps {
  isToolbarTranslateY: boolean
  canSubmit: boolean
}

export const toolbarProps = {
  isToolbarTranslateY: Boolean,
  canSubmit: Boolean,
}

export interface ToolBarEmits {
  (evt: "imagechange", files: File[]): void
  (evt: "filechange", files: File[]): void
}