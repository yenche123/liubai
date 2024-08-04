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
  LiuUploadDraft,
  LiuUploadMember,
  LiuUploadThread,
  SyncSetAtom,
} from "~/types/cloud/sync-set/types"
import { classifyUploadTask } from "../../tools/upload-event-classification"
import { db } from "~/utils/db";
import transferUtil from "~/utils/transfer-util";
import uut from "../tools/update-upload-task"

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
  
  if(isContent && content_id) {
    content = await db.contents.get(content_id)
  }

  // 2.2 get workspace
  if(isWorkspace && workspace_id) {
    workspace = await db.workspaces.get(workspace_id)
  }

  // 2.3 get member
  if(isMember && !isOStateChange && member_id) {
    member = await db.members.get(member_id)
  }

  // 2.4 get draft
  if(isDraft && draft_id && ut !== "draft-clear") {
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
    removedStamp: c.removedStamp,

    tagIds: c.tagIds,
    tagSearched: c.tagSearched,
    stateId: c.stateId,

    emojiData: c.emojiData,
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

    emojiData: c.emojiData,
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

function whenMemberAvatar(m: MemberLocalTable) {
  const uploadMember: LiuUploadMember = {
    id: m._id,
  }
  if(!m.avatar) return uploadMember
  const list = transferUtil.imagesFromStoreToCloud([m.avatar])
  if(list?.length) {
    uploadMember.avatar = list[0]
  }
  return uploadMember
}

function whenDraftSet(d: DraftLocalTable) {
  const uploadDraft: LiuUploadDraft = {
    id: d._id,
    first_id: d.first_id,
    spaceId: d.spaceId,

    // liuDesc is put below

    editedStamp: d.editedStamp,
    infoType: d.infoType,

    threadEdited: d.threadEdited,
    commentEdited: d.commentEdited,
    parentThread: d.parentThread,
    parentComment: d.parentComment,
    replyToComment: d.replyToComment,
    
    title: d.title,
    whenStamp: d.whenStamp,
    remindMe: d.remindMe,
    tagIds: d.tagIds,
  }
  if(d.liuDesc) {
    uploadDraft.liuDesc = transferUtil.tiptapToLiu(d.liuDesc, { trim: false })
  }
  return uploadDraft
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
  if(ut === "thread-post" && content) {
    atom.thread = whenThreadPost(content)
    if(atom.thread) isOK = true
  }
  else if(ut === "comment-post" && content) {
    atom.comment = whenCommentPost(content)
    isOK = true
  }
  else if(ut === "thread-edit" && content) {
    atom.thread = whenThreadEdit(content)
    isOK = true
  }
  else if(ut === "thread-only_local") {
    if(!task.content_id) return
    atom.thread = {
      id: task.content_id,
    }
    isOK = true
  }
  else if((ut === "thread-hourglass" || ut === "undo_thread-hourglass") && content) {
    const showCountdown = content.config?.showCountdown ?? false
    atom.thread = {
      id: content._id,
      first_id: content.first_id,
      showCountdown,
    }
    isOK = true
  }
  else if(ut === "thread-when-remind" || ut === "undo_thread-when-remind") {
    if(!content) return
    atom.thread = {
      id: content._id,
      first_id: content.first_id,
      calendarStamp: content.calendarStamp,
      whenStamp: content.whenStamp,
      remindStamp: content.remindStamp,
      remindMe: content.remindMe,
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
      sortStamp: collection.sortStamp,
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
      sortStamp: collection.sortStamp,
    }
    isOK = true
  }
  else if(ut === "thread-delete" || ut === "undo_thread-delete") {
    if(!task.content_id) return
    if(!content) return
    atom.thread = {
      id: task.content_id,
      removedStamp: content.removedStamp,
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
  else if(ut === "comment-delete" && task.content_id) {
    atom.comment = {
      id: task.content_id,
    }
    isOK = true
  }
  else if(ut === "comment-edit" && content) {
    atom.comment = whenCommentEdit(content)
    isOK = true
  }
  else if(ut === "workspace-tag" && workspace) {
    atom.workspace = {
      id: workspace._id,
      tagList: workspace.tagList,
    }
    isOK = true
  }
  else if(ut === "workspace-state_config" && workspace) {
    atom.workspace = {
      id: workspace._id,
      stateConfig: workspace.stateConfig,
    }
    isOK = true
  }
  else if(ut === "undo_workspace-state_config" && workspace) {
    atom.workspace = {
      id: workspace._id,
      stateConfig: workspace.stateConfig,
    }
    isOK = true
  }
  else if(ut === "member-avatar" && member) {
    atom.member = whenMemberAvatar(member)
    isOK = true
  }
  else if(ut === "member-nickname" && member) {
    atom.member = {
      id: member._id,
      name: member.name,
    }
    isOK = true
  }
  else if(ut === "draft-clear" && task.draft_id) {
    atom.draft = {
      id: task.draft_id,
      oState: "POSTED",
    }
    isOK = true
  }
  else if(ut === "draft-set" && draft) {
    atom.draft = whenDraftSet(draft)
    isOK = true
  }

  return isOK ? atom : undefined
}



export async function packSyncSetAtoms(tasks: UploadTaskLocalTable[]) {
  const atoms: SyncSetAtom[] = []
  for(let i=0; i<tasks.length; i++) {
    const v = tasks[i]
    const atom = await organizeAtom(v)
    if(atom) {
      atoms.push(atom)
    }
    else {
      console.warn("failed to organizeAtom, so delete it")
      uut.toDeleteTask(v._id)
    }
  }

  return atoms
}