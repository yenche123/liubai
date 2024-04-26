import APIs from "~/requests/APIs";
import type { 
  UploadTaskLocalTable,
} from "~/types/types-table";
import time from "~/utils/basic/time";
import { db } from "~/utils/db";
import { packSyncSetAtoms } from "./tools/prepare-for-uploading";
import uut from "../tools/update-upload-task"
import type { 
  Res_SyncSet_Client, 
  SyncSetAtomRes,
} from "~/requests/req-types"
import type { SyncSetAtom } from "./tools/types"
import type { BulkUpdateAtom_UploadTask } from "../tools/types"
import liuReq from "~/requests/liu-req";

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
  const results = res4.data?.results ?? []
  afterSyncSet(results, atoms)

}

async function afterSyncSet(
  results: SyncSetAtomRes[],
  atoms: SyncSetAtom[],
) {
  const delete_list: string[] = []
  const update_list: BulkUpdateAtom_UploadTask[] = []
  
  for(let i=0; i<results.length; i++) {
    const v = results[i]
    const { code, taskId, first_id, new_id } = v
    const atom = atoms.find(v => v.taskId === taskId)
    if(!atom) continue
    const { taskType } = atom
    



  }

}


