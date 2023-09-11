
import type { TagShow } from "~/types/types-content"

export interface HsirAtom extends TagShow {
  added: boolean
}

export interface HsirData {
  focus: boolean
  inputTxt: string
  list: HsirAtom[]
  selectedIndex: number
  recentTagIds: string[]
}

export interface HsirProps {
  listAdded: TagShow[]
}

export interface HsirEmit {
  (evt: "focusornot", focus: boolean): void
  (evt: "tapitem", item: TagShow): void
}