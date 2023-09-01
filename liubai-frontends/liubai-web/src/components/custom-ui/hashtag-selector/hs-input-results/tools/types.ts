
import type { TagShow } from "~/types/types-content"
import type { TagSearchItem } from "~/utils/system/tag-related/tools/types"


export interface HsirAtom extends TagSearchItem {
  added: boolean
}

export interface HsirData {
  focus: boolean
  inputTxt: string
  list: HsirAtom[]
  selectedIndex: number
}

export interface HsirProps {
  listAdded: TagShow[]
}

export interface HsirEmit {
  (evt: "focusornot", focus: boolean): void
}