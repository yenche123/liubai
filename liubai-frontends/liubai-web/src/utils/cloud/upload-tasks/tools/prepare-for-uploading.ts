import type { 
  ContentLocalTable,
  DraftLocalTable,
  UploadTaskLocalTable,
  WorkspaceLocalTable,
} from "~/types/types-table";
import type {
  SyncSetAtom,
} from "./types"
import type { LiuUploadTask } from "~/types/types-atom";

// getting content from db when these events occur 
const need_content_evts: LiuUploadTask[] = [
  "content-post",
  "thread-edit",
  "thread-hourglass",
  "undo_thread-hourglass",
  "thread-state",
  "undo_thread-state",
  "thread-restore",
  "thread-pin",
  "undo_thread-pin",
  "thread-tag",
  "comment-edit",
]

const need_workspace_evts: LiuUploadTask[] = [
  
]


async function getRawData(task: UploadTaskLocalTable) {
  const { 
    uploadTask: ut,
    content_id,
    workspace_id,
    member_id,
    draft_id,
  } = task

  // 1. define raw data
  let content: ContentLocalTable | undefined
  let workspace: WorkspaceLocalTable | undefined
  let member: WorkspaceLocalTable | undefined
  let draft: DraftLocalTable | undefined

  // 2. get content
  


  return {
    content,
    workspace,
    member,
    draft,
  }
}


async function organizeAtom(task: UploadTaskLocalTable) {
  const { content, workspace, member, draft } = await getRawData(task)


}



export function packSyncSetAtoms(tasks: UploadTaskLocalTable[]) {
  const atoms: SyncSetAtom[] = []
  for(let i=0; i<tasks.length; i++) {
    const v = tasks[i]
    
  }
}