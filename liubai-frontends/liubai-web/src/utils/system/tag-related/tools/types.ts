import type { TagView } from "~/types/types-atom"
import type { TagShow } from "~/types/types-content"

export interface WhichTagChange {
  changeType?: "translate" | "across"    // 平移 / 跨级移动
  tagId?: string
  children?: string[]   // 如果是跨级移动，必存在，并且包含自己
  isMerged?: boolean
  from_ids?: string[]   // isMerged 为 true 时才存在，表示要从 contents 中删除的 tag id 们
  to_ids?: string[]   // isMerged 为 true 时才存在，表示要从 contents 中追加的 tag id 们
  newNewTree?: TagView[]  // isMerged 为 true 时才存在，表示合并后新的 tree
}

export interface BaseTagRes {
  isOk: boolean
  errMsg?: string
  errCode?: string     // 01: 超过 3 级了
}

/**
 * text 参数必须是过滤后的文字，也就是必须已去掉 "/" 前后的空白
 */
export interface AddATagParam {
  text: string          // 必须是已 formatTagText() 过的文字
  icon?: string
}

export type AddTagsParam = AddATagParam[]


export interface AddATagRes extends BaseTagRes {
  id?: string
}

export interface AddATagAtom {
  id: string
  text: string
}

export interface AddTagsRes extends BaseTagRes {
  results?: AddATagAtom[]
}

export interface CreateTagsFromTagShowsRes extends BaseTagRes {
  tagShows: TagShow[]
}

export interface RenameTagParam {
  id: string
  text: string
  icon?: string
  originTag: TagView
}

