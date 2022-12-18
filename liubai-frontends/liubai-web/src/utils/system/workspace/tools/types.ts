import { TagView } from "../../../../types/types-atom"

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
}

export interface AddATagParam {
  text: string          // 必须是已 formatTagText() 过的文字
  icon?: string
}

export interface AddATagRes extends BaseTagRes {
  id?: string
}

export interface RenameTagParam {
  id: string
  text: string
  icon?: string
  originTag: TagView
}

