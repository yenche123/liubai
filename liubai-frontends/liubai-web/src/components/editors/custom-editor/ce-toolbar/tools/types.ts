import type { TipTapEditor } from "~/types/types-editor";
import type { PropType } from "vue";
import type { TagShow } from "~/types/types-content";

export interface CetEmit {
  (evt: "imagechange", files: File[]): void
  (evt: "newhashtags", tagShows: TagShow[]): void
  (evt: "tapmore"): void
}

export interface CetProps {
  editor?: TipTapEditor
  more: boolean
  tagShows: TagShow[]
}

export const cetProps = {
  editor: Object as PropType<TipTapEditor>,
  more: Boolean,
  tagShows: {
    type: Array as PropType<TagShow[]>,
    default: []
  },
}