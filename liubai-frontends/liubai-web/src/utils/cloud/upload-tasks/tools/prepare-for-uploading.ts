import type { 
  CollectionLocalTable,
  ContentLocalTable,
  DraftLocalTable,
  MemberLocalTable,
  UploadTaskLocalTable,
  WorkspaceLocalTable,
} from "~/types/types-table";
import type {
  SyncSetAtom,
} from "./types"
import type { LiuUploadTask } from "~/types/types-atom";
import { db } from "~/utils/db";

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
  "workspace-tag",
  "workspace-state_config",
]

const need_member_evts: LiuUploadTask[] = [
  "member-avatar",
  "member-nickname",
]

const need_draft_evts: LiuUploadTask[] = [
  "draft-set",
]

const need_collection_evts: LiuUploadTask[] = [
  "collection-favorite",
  "undo_collection-favorite",
  "collection-react",
  "undo_collection-react",
]


async function getRawData(task: UploadTaskLocalTable) {
  const { 
    uploadTask: ut,
    content_id,
    workspace_id,
    member_id,
    draft_id,
    collection_id,
  } = task

  // 1. define raw data
  let content: ContentLocalTable | undefined
  let workspace: WorkspaceLocalTable | undefined
  let member: MemberLocalTable | undefined
  let draft: DraftLocalTable | undefined
  let collection: CollectionLocalTable | undefined

  // 2.1 get content
  const needContent = need_content_evts.includes(ut)
  if(needContent && content_id) {
    content = await db.contents.get(content_id)
  }

  // 2.2 get workspace
  const needWorkspace = need_workspace_evts.includes(ut)
  if(needWorkspace && workspace_id) {
    workspace = await db.workspaces.get(workspace_id)
  }

  // 2.3 get member
  const needMember = need_member_evts.includes(ut)
  if(needMember && member_id) {
    member = await db.members.get(member_id)
  }

  // 2.4 get draft
  const needDraft = need_draft_evts.includes(ut)
  if(needDraft && draft_id) {
    draft = await db.drafts.get(draft_id)
  }

  // 2.5 get collection
  const needCollection = need_collection_evts.includes(ut)
  if(needCollection && collection_id) {
    collection = await db.collections.get(collection_id)
  }

  return {
    content,
    workspace,
    member,
    draft,
    collection,
  }
}


async function organizeAtom(task: UploadTaskLocalTable) {
  const { 
    content, 
    workspace, 
    member, 
    draft,
    collection,
  } = await getRawData(task)

  const { uploadTask: ut } = task

  // start to package atom based on uploadTask
  if(ut === "content-post" && content) {

  }




}



export function packSyncSetAtoms(tasks: UploadTaskLocalTable[]) {
  const atoms: SyncSetAtom[] = []
  for(let i=0; i<tasks.length; i++) {
    const v = tasks[i]
    organizeAtom(v)
  }
}