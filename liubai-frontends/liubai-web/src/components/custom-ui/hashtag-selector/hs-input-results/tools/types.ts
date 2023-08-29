
import type { TagSearchItem } from "~/utils/system/tag-related/tools/types"

export type HsirAtom = TagSearchItem

export interface HsirData {
  focus: boolean
  inputTxt: string
  list: HsirAtom[]
}

export interface HsirEmit {
  (evt: "focusornot", focus: boolean): void
}