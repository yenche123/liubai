import APIs from "~/requests/APIs";
import type { 
  ContentLocalTable,
  CollectionLocalTable,
  UploadTaskLocalTable,
  DraftLocalTable,
} from "~/types/types-table";
import time from "~/utils/basic/time";
import { db, type DexieTable } from "~/utils/db";
import { packSyncSetAtoms } from "./tools/prepare-for-uploading";
import uut from "./tools/update-upload-task"
import type { 
  SyncSetAtom,
  Res_SyncSet_Client, 
  SyncSetAtomRes,
} from "~/types/cloud/sync-set/types"
import liuReq from "~/requests/liu-req";
import { useSyncStore, type SyncStoreAtom } from "~/hooks/stores/useSyncStore"
import newIds from "./tools/handle-new-ids"

export async function syncTasks(tasks: UploadTaskLocalTable[]) {

  // 0. define the filter function
  const now = time.getTime()
  const _filterFunc = (task: UploadTaskLocalTable) => {
    const t1 = task.failedStamp
    if(t1 && (now - t1) < time.MINUTE) return false
    if(task.progressType !== "waiting") return false
    return true      
  }

  // 1. get tasks again
  const taskIds_1 = tasks.map(v => v._id)
  const col_1 = db.upload_tasks.where("_id").anyOf(taskIds_1)
  const col_2 = col_1.filter(_filterFunc)
  const res1 = await col_2.toArray()
  if(res1.length < 1) return true

  // 2. package atoms
  const atoms = await packSyncSetAtoms(res1)
  if(atoms.length < 1) return true
  
  // 3. update tasks' progressType to "syncing"
  const taskIds_3 = atoms.map(v => v.taskId)
  await uut.bulkChangeProgressType(taskIds_3, "syncing")

  // 4. request!
  const url = APIs.SYNC_SET
  const opt = {
    operateType: "general_sync",
    plz_enc_atoms: atoms,
  }
  const res4 = await liuReq.request<Res_SyncSet_Client>(url, opt)
  console.log("查看 sync-set 的结果: ")
  console.log(res4)

  // 5. if ok, call afterSyncSet
  const results = res4.data?.results ?? []
  if(res4.code === "0000") {
    const res5 = await afterSyncSet(results, atoms)
    return res5
  }

  // 6. otherwise, just update tasks' progressType to "waiting"
  await uut.bulkChangeProgressType(taskIds_3, "waiting")
  return false
}

/** the function will be triggered after fetching sync-set */
async function afterSyncSet(
  results: SyncSetAtomRes[],
  atoms: SyncSetAtom[],
) {

  // 1. those results have new ids
  const list: SyncStoreAtom[] = []

  for(let i=0; i<results.length; i++) {
    const v = results[i]
    const { code, taskId, first_id, new_id } = v

    let idx = -1
    const atom = atoms.find((v2, i2) => {
      if(v2.taskId !== taskId) return false
      idx = i2
      return true
    })
    if(!atom) {
      console.warn("failed to find any atom in afterSyncSet.......")
      console.log(atoms)
      console.log(v)
      return false
    }

    const completed = code === "0000" || code === "0001" || code === "0002"
    if(!completed) continue

    const { taskType } = atom
    if(first_id && new_id && first_id !== new_id) {
      if(taskType === "thread-post") {
        list.push({ whichType: "thread", first_id, new_id })
      }
      else if(taskType === "comment-post") {
        list.push({ whichType: "comment", first_id, new_id })
      }
      else if(taskType === "collection-favorite") {
        list.push({ whichType: "collection", first_id, new_id })
      }
      else if(taskType === "collection-react") {
        list.push({ whichType: "collection", first_id, new_id })
      }
      else if(taskType === "draft-set") {
        list.push({ whichType: "draft", first_id, new_id })
      }
    }
  }


  const delete_list = atoms.map(v => v.taskId)

  await deleteUploadTasks(delete_list)
  dataHasNewIds(list)

  return true
}

async function deleteUploadTasks(
  delete_list: string[]
) {
  if(delete_list.length < 1) return
  await db.upload_tasks.bulkDelete(delete_list)
}

type ReplaceTable = ContentLocalTable | CollectionLocalTable | DraftLocalTable

async function replaceInSpecificTable<T extends ReplaceTable>(
  tableName: "contents" | "collections" | "drafts",
  list: SyncStoreAtom[],
) {
  if(list.length < 1) return
  const first_ids = list.map(v => v.first_id)
  const new_ids = list.map(v => v.new_id)

  // 1. seek data from db
  const table = db[tableName] as DexieTable<T>
  const res1 = await table.where("_id").anyOf(first_ids).toArray()
  if(res1.length < 1) return

  // 2. get new data and delete_ids
  const now = time.getTime()
  const delete_ids: string[] = []
  const list2: T[] = []
  for(let i=0; i<res1.length; i++) {
    const v = res1[i]
    const idx = first_ids.indexOf(v._id)
    if(idx < 0) continue
    const oldId = first_ids[idx]
    const newId = new_ids[idx]
    let obj = { 
      ...v,
      _id: newId,
      firstSyncStamp: now
    } as T

    if(tableName === "contents") {
      const obj2 = obj as ContentLocalTable
      if(obj2.storageState === "WAIT_UPLOAD") {
        obj2.storageState = "CLOUD"
        obj = obj2 as T
      }
    }

    list2.push(obj)
    delete_ids.push(oldId)
  }

  if(delete_ids.length < 1 || list2.length < 1) {
    console.warn("delete_ids or list2 is empty")
    console.log(delete_ids)
    console.log(list2)
    console.log(" ")
    return
  }

  // 3. put new data into db
  const res3 = await table.bulkPut(list2)
  console.log("replaceInSpecificTable res3: ")
  console.log(res3)
  console.log(" ")

  // 4. delete these old data
  await table.bulkDelete(delete_ids)

  // 5. check all table to update
  if(tableName === "contents") {
    await newIds.handle_new_contentIds(first_ids, new_ids)
  }
  else if(tableName === "collections") {
    await newIds.handle_new_collectionIds(first_ids, new_ids)
  }
  else if(tableName === "drafts") {
    await newIds.handle_new_draftIds(first_ids, new_ids)
  }
}

async function dataHasNewIds(
  list: SyncStoreAtom[],
) {
  if(list.length < 1) return

  console.log("dataHasNewIds.......")

  const list_content = list.filter(v => {
    return v.whichType === "comment" || v.whichType === "thread"
  })
  const list_collection = list.filter(v => v.whichType === "collection")
  const list_draft = list.filter(v => v.whichType === "draft")

  await replaceInSpecificTable("contents", list_content)
  await replaceInSpecificTable("collections", list_collection)
  await replaceInSpecificTable("drafts", list_draft)

  // notify via useSyncStore()
  console.log("go to notify useSyncStore..........")
  console.log(" ")
  const sStore = useSyncStore()
  sStore.afterSync(list)
}


