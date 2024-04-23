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
import { classifyUploadTask } from "../../tools/upload-event-classification"
import { db } from "~/utils/db";
import transferUtil from "~/utils/transfer-util";

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
  const {
    isContent,
    isWorkspace,
    isMember,
    isDraft,
    isCollection,
    isOStateChange,
  } = classifyUploadTask(ut)
  
  if(isContent && !isOStateChange && content_id) {
    content = await db.contents.get(content_id)
  }

  // 2.2 get workspace
  if(isWorkspace && !isOStateChange && workspace_id) {
    workspace = await db.workspaces.get(workspace_id)
  }

  // 2.3 get member
  if(isMember && !isOStateChange && member_id) {
    member = await db.members.get(member_id)
  }

  // 2.4 get draft
  if(isDraft && !isOStateChange && draft_id) {
    draft = await db.drafts.get(draft_id)
  }

  // 2.5 get collection
  if(isCollection && collection_id) {
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

function whenCommentEdit(c: ContentLocalTable) {
  let uploadComment: LiuUploadComment = {
    id: c._id,
    first_id: c.first_id,
    liuDesc: c.liuDesc,
    images: transferUtil.imagesFromStoreToCloud(c.images),
    files: transferUtil.filesFromStoreToCloud(c.files),
    editedStamp: c.editedStamp,
  }
  return uploadComment
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
      isOK = true
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
  else if(ut === "thread-delete" || ut === "undo_thread-delete") {
    if(!task.content_id) return
    atom.thread = {
      id: task.content_id,
    }
    isOK = true
  }
  else if(ut === "thread-delete_forever" || ut === "thread-restore") {
    if(!task.content_id) return
    atom.thread = {
      id: task.content_id,
    }
    isOK = true
  }
  else if(ut === "thread-state" || ut === "undo_thread-state") {
    if(!content) return
    atom.thread = {
      id: content._id,
      first_id: content.first_id,
      stateId: content.stateId,
    }
    isOK = true
  }
  else if(ut === "thread-pin" || ut === "undo_thread-pin") {
    if(!content) return
    atom.thread = {
      id: content._id,
      first_id: content.first_id,
      pinStamp: content.pinStamp,
    }
    isOK = true
  }
  else if(ut === "thread-tag" && content) {
    atom.thread = {
      id: content._id,
      first_id: content.first_id,
      tagIds: content.tagIds,
      tagSearched: content.tagSearched,
    }
    isOK = true
  }
  else if(ut === "comment-delete") {
    if(!task.content_id) return
    atom.comment = {
      id: task.content_id,
    }
    isOK = true
  }
  else if(ut === "comment-edit" && content) {
    atom.comment = whenCommentEdit(content)
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