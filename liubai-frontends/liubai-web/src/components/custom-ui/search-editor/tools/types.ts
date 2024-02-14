import type {
  ScContentAtom,
  ScRecentAtom,
  ScThirdPartyAtom,
  ScThirdPartyType,
  ScMode,
} from "~/utils/controllers/search-controller/types"
import type {
  InjectionKey,
  Ref,
} from "vue"

export type ThirdPartyType = ScThirdPartyType

export type SearchListType = "suggest" | "recent" | "results" | "third_party"

export interface SearchEditorData {
  reloadNum: number
  mode: ScMode
  inputTxt: string
  nativeInputTxt: string
  trimTxt: string
  excludeThreads: string[]
  indicator: string               // 指示器，表示现在选中的是哪一个
  suggestList: ScContentAtom[]
  recentList: ScRecentAtom[]
  thirdList: ScThirdPartyAtom[]
  innerList: ScContentAtom[]
}

export interface SearchEditorParam {
  type: ScMode
  initText?: string
  excludeThreads?: string[]
}

export interface SearchEditorRes {
  action: "confirm" | "cancel"
  threadId?: string
  commentId?: string
  atomId?: string
}

export type SeResolver = (res: SearchEditorRes) => void


export interface SearchFuncs {
  mouseenteritem: (newIndicator: string) => void
  tapitem: (listType: SearchListType, atomId: string) => void
  clearitem: (listType: SearchListType, atomId: string) => void
}

export const searchFuncsKey = Symbol() as InjectionKey<SearchFuncs>

export interface SeKeyboardParam {
  whenOpen: (param: SearchEditorParam) => Promise<SearchEditorRes>
  seData: SearchEditorData
  tranMs: number
  show: Ref<boolean>
}