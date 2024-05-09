import type { 
  CollectionLocalTable, 
  ContentLocalTable, 
  DownloadTaskLocalTable, 
  DraftLocalTable, 
  UploadTaskLocalTable, 
  WorkspaceLocalTable,
} from "~/types/types-table"
import { db } from "~/utils/db"


async function _handle_shared(
  first_ids: string[],
  new_ids: string[],
  tableName: "contents" | "collections" | "drafts",
) {

  // 1. checking out download_tasks
  const _filterDownloadTasks = (item: DownloadTaskLocalTable) => {
    if(item.target_table !== tableName) return false
    return first_ids.includes(item.target_id)
  }
  const _modifyDownloadTasks = (item: DownloadTaskLocalTable) => {
    const idx = first_ids.indexOf(item.target_id)
    if(idx >= 0) item.target_id = new_ids[idx]
  }
  const col1 = db.download_tasks.filter(_filterDownloadTasks)
  const res1 = await col1.modify(_modifyDownloadTasks)
  console.log(`_handle_shared ${tableName} download_tasks res5: `, res1)

  // 2. checking out upload_tasks
  const _filterUploadTasks = (item: UploadTaskLocalTable) => {
    let c2: string | undefined
    if(tableName === "contents") {
      c2 = item.content_id
    }
    else if(tableName === "collections") {
      c2 = item.collection_id
    }
    else if(tableName === "drafts") {
      c2 = item.draft_id
    }
    if(!c2) return false
    return first_ids.includes(c2)
  }
  const _modifyUploadTasks = (item: UploadTaskLocalTable) => {
    let c2: string | undefined
    if(tableName === "contents") {
      c2 = item.content_id
    }
    else if(tableName === "collections") {
      c2 = item.collection_id
    }
    else if(tableName === "drafts") {
      c2 = item.draft_id
    }
    if(!c2) return
    const idx = first_ids.indexOf(c2)
    if(idx < 0) return
    const newId = new_ids[idx]
    if(tableName === "contents") {
      item.content_id = newId
    }
    else if(tableName === "collections") {
      item.collection_id = newId
    }
    else if(tableName === "drafts") {
      item.draft_id = newId
    }
  }
  const col2 = db.upload_tasks.filter(_filterUploadTasks)
  const res2 = await col2.modify(_modifyUploadTasks)
  console.log(`_handle_shared ${tableName} upload_tasks res2: `, res2)
}



async function handle_new_contentIds(
  first_ids: string[],
  new_ids: string[],
) {

  // 1. checking out workspace
  const _filterWorkspace = (item: WorkspaceLocalTable) => {
    const sc = item.stateConfig
    if(!sc) return false
    const tmpList = sc.stateList
    const tmp1 = tmpList.find(v1 => {
      const contentIds = v1.contentIds
      if(!contentIds) return false
      const tmp2 = contentIds.find(v2 => first_ids.includes(v2))
      return Boolean(tmp2)
    })
    return Boolean(tmp1)
  }
  const res1 = await db.workspaces.filter(_filterWorkspace).modify(item => {
    const sc = item.stateConfig
    if(!sc) return
    let tmpList = sc.stateList
    tmpList = tmpList.map(v1 => {
      let contentIds = v1.contentIds
      if(!contentIds) return v1
      contentIds = contentIds.map(v2 => {
        const idx2 = first_ids.indexOf(v2)
        if(idx2 >= 0) return new_ids[idx2]
        return v2
      })
      v1.contentIds = contentIds
      return v1
    })
    sc.stateList = tmpList
    item.stateConfig = sc
  })
  console.log("handle_new_contentIds workspace res1: ", res1)

  // 2. checking out content
  const _filterContentDraft = (item: ContentLocalTable | DraftLocalTable) => {
    if(item.infoType === "THREAD") return false
    const {
      parentThread: p1,
      parentComment: p2,
      replyToComment: r1,
    } = item
    if(p1 && first_ids.includes(p1)) return true
    if(p2 && first_ids.includes(p2)) return true
    if(r1 && first_ids.includes(r1)) return true
    return false
  }
  const _modifyContentDraft = (item: ContentLocalTable | DraftLocalTable) => {
    if(item.infoType === "THREAD") return
    const {
      parentThread: p1,
      parentComment: p2,
      replyToComment: r1,
    } = item
    if(p1) {
      const idx1 = first_ids.indexOf(p1)
      if(idx1 >= 0) item.parentThread = new_ids[idx1]
    }
    if(p2) {
      const idx2 = first_ids.indexOf(p2)
      if(idx2 >= 0) item.parentComment = new_ids[idx2]
    }
    if(r1) {
      const idx3 = first_ids.indexOf(r1)
      if(idx3 >= 0) item.replyToComment = new_ids[idx3]
    }
  }
  const col2 = db.contents.filter(_filterContentDraft)
  const res2 = await col2.modify(_modifyContentDraft)
  console.log("handle_new_contentIds content res2: ", res2)

  // 3. checking out draft
  const col3 = db.drafts.filter(_filterContentDraft)
  const res3 = await col3.modify(_modifyContentDraft)
  console.log("handle_new_contentIds draft res3: ", res3)

  // 4. checking out collection
  const _filterCollection = (item: CollectionLocalTable) => {
    return new_ids.includes(item.content_id)
  }
  const res4 = await db.collections.filter(_filterCollection).modify(item => {
    const idx = first_ids.indexOf(item.content_id)
    if(idx >= 0) item.content_id = new_ids[idx]
  })
  console.log("handle_new_contentIds collection res4: ", res4)

  // 5. checking out shared func
  await _handle_shared(first_ids, new_ids, "contents")
}

async function handle_new_collectionIds(
  first_ids: string[],
  new_ids: string[],
) {
  await _handle_shared(first_ids, new_ids, "collections")
}

async function handle_new_draftIds(
  first_ids: string[],
  new_ids: string[],
) {
  await _handle_shared(first_ids, new_ids, "drafts")
}

export default {
  handle_new_contentIds,
  handle_new_collectionIds,
  handle_new_draftIds,
}