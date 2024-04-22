import type { 
  CollectionLocalTable,
  ContentLocalTable,
  DraftLocalTable,
  MemberLocalTable,
  UploadTaskLocalTable,
  WorkspaceLocalTable,
} from "~/types/types-table";
import type {
  LiuUploadComment,
  LiuUploadThread,
  SyncSetAtom,
} from "./types"
import type { LiuUploadTask } from "~/types/types-atom";
import { db } from "~/utils/db";
import transferUtil from "~/utils/transfer-util";

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


function whenThreadPost(c: ContentLocalTable) {
  if(c.oState === "DELETED") return

  let uploadThread: LiuUploadThread = {
    first_id: c.first_id,
    spaceId: c.spaceId,
    liuDesc: c.liuDesc,
    images: transferUtil.imagesFromStoreToCloud(c.images),
    files: transferUtil.filesFromStoreToCloud(c.files),
    editedStamp: c.editedStamp,
    oState: c.oState,
    title: c.title,
    calendarStamp: c.calendarStamp,
    remindStamp: c.remindStamp,
    whenStamp: c.whenStamp,
    remindMe: c.remindMe,
    pinStamp: c.pinStamp,
    createdStamp: c.createdStamp,
    tagIds: c.tagIds,
    tagSearched: c.tagSearched,
    stateId: c.stateId,
    config: c.config,
  }
  return uploadThread
}

function whenCommentPost(c: ContentLocalTable) {
  let uploadComment: LiuUploadComment = {
    first_id: c.first_id,
    spaceId: c.spaceId,
    liuDesc: c.liuDesc,
    images: transferUtil.imagesFromStoreToCloud(c.images),
    files: transferUtil.filesFromStoreToCloud(c.files),
    editedStamp: c.editedStamp,
    parentThread: c.parentThread,
    parentComment: c.parentComment,
    replyToComment: c.replyToComment,
    createdStamp: c.createdStamp,
  }
  return uploadComment
}

function whenThreadEdit(c: ContentLocalTable) {
  let uploadThread: LiuUploadThread = {
    id: c._id,
    first_id: c.first_id,
    liuDesc: c.liuDesc,
    images: transferUtil.imagesFromStoreToCloud(c.images),
    files: transferUtil.filesFromStoreToCloud(c.files),
    editedStamp: c.editedStamp,
    title: c.title,
    calendarStamp: c.calendarStamp,
    remindStamp: c.remindStamp,
    whenStamp: c.whenStamp,
    remindMe: c.remindMe,
    tagIds: c.tagIds,
    tagSearched: c.tagSearched,
  }
  return uploadThread
}


async function organizeAtom(task: UploadTaskLocalTable) {
  const { 
    content, 
    workspace, 
    member, 
    draft,
    collection,
  } = await getRawData(task)

  
  const { uploadTask: ut, _id: taskId } = task
  let isOK = false
  const atom: SyncSetAtom = { 
    taskType: ut,
    taskId,
    operateStamp: task.insertedStamp,
  }

  // start to package atom based on uploadTask
  if(ut === "content-post" && content) {
    if(content.infoType === "THREAD") {
      atom.thread = whenThreadPost(content)
      if(atom.thread) isOK = true
    }
    else if(content.infoType === "COMMENT") {
      atom.comment = whenCommentPost(content)
      if(atom.comment) isOK = true
    }
  }
  else if(ut === "thread-edit" && content) {
    atom.thread = whenThreadEdit(content)
    isOK = true
  }
  else if((ut === "thread-hourglass" || ut === "undo_thread-hourglass") && content) {
    atom.thread = {
      id: content._id,
      first_id: content.first_id,
      config: content.config,
    }
    isOK = true
  }
  else if(ut === "collection-favorite" || ut === "undo_collection-favorite") {
    if(!collection) return
    atom.collection = {
      id: collection._id,
      first_id: collection.first_id,
      oState: collection.oState,
      content_id: collection.content_id,
    }
    isOK = true
  }
  else if(ut === "collection-react" || ut === "undo_collection-react") {
    if(!collection) return
    atom.collection = {
      id: collection._id,
      first_id: collection.first_id,
      oState: collection.oState,
      content_id: collection.content_id,
      emoji: collection.emoji,
    }
    isOK = true
  }
  

  return isOK ? atom : undefined
}



export function packSyncSetAtoms(tasks: UploadTaskLocalTable[]) {
  const atoms: SyncSetAtom[] = []
  for(let i=0; i<tasks.length; i++) {
    const v = tasks[i]
    organizeAtom(v)
  }
}