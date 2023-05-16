
import type { HashTagEditorRes } from "~/types/other/types-hashtag"
import type { TipTapEditor } from "~/types/types-editor"
import type { PropType } from "vue"

export interface CetEmit {
  (event: "imagechange", files: File[]): void
  (event: "addhashtag", res: HashTagEditorRes): void
  (event: "tapmore"): void
}

export interface CetProps {
  editor?: TipTapEditor
  more: boolean
}

export const cetProps = {
  editor: Object as PropType<TipTapEditor>,
  more: Boolean,
}