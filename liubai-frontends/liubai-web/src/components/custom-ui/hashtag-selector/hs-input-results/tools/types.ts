
import type { TagSearchItem } from "~/utils/system/tag-related/tools/types"

export interface HsirData {
  focus: boolean
  inputTxt: string
  list: TagSearchItem[]
  selectedIndex: number
}

export interface HsirEmit {
  (evt: "focusornot", focus: boolean): void
}