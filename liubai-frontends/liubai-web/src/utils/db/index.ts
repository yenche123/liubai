import Dexie, { Table } from 'dexie';
import type { 
  UserLocalTable, 
  WorkspaceLocalTable, 
  MemberLocalTable,
  DraftLocalTable,
  ContentLocalTable,
  CollectionLocalTable,
} from "../../types/types-table"

/**
 * 注意：
 *   1. 只在已有的 interface CustomTable 里新增 数据类型，并不需要提升 version
 *   2. 唯有 新增数据表（objectStore），或者 修改索引时，需要提升 version
 *   3. 没有在 this.version(3).stores() 里定义的数据表，会被删除（以前定义过，后来移除了，就会被删除）
 *   4. 只提升 version 并不会造成原有数据丢失，除非 this.version(3).stores() 里头没有定义了
 */

export class LiuDexie extends Dexie {

  users!: Table<UserLocalTable>
  workspaces!: Table<WorkspaceLocalTable>
  members!: Table<MemberLocalTable>
  drafts!: Table<DraftLocalTable>
  contents!: Table<ContentLocalTable>
  collections!: Table<CollectionLocalTable>

  constructor() {
    super('LiubaiDatabase')

    let workspacesIdx = "_id, [infoType+owner]"

    let membersIdx = "_id, [user+workspace]"

    let draftsIdx = "_id, [infoType+oState+user+workspace], *tagIds"

    let contentsIdx = "_id, createdStamp, updatedStamp, *tagIds, *tagSearched"

    let collectionsIdx = "_id, content_id, insertedStamp, [member+infoType+forType+content_id], updatedStamp"

    this.version(26).stores({
      users: "_id",
      workspaces: workspacesIdx,
      members: membersIdx,
      drafts: draftsIdx,
      contents: contentsIdx,
      collections: collectionsIdx
    })
  }

}

export const db = new LiuDexie()