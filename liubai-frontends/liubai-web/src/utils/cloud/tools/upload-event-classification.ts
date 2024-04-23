import type { LiuUploadTask } from "~/types/types-atom";

const content_evts: LiuUploadTask[] = [
  "content-post",
  "thread-edit",
  "thread-hourglass",
  "undo_thread-hourglass",
  "thread-state",
  "undo_thread-state",
  "thread-pin",
  "undo_thread-pin",
  "thread-tag",
  "comment-edit",
  "thread-delete",
  "undo_thread-delete",
  "thread-delete_forever",
  "thread-restore",
  "comment-delete",
]

const workspace_evts: LiuUploadTask[] = [
  "workspace-tag",
  "workspace-state_config",
]

const member_evts: LiuUploadTask[] = [
  "member-avatar",
  "member-nickname",
]

const draft_evts: LiuUploadTask[] = [
  "draft-set",
  "draft-clear",
]

const collection_evts: LiuUploadTask[] = [
  "collection-favorite",
  "undo_collection-favorite",
  "collection-react",
  "undo_collection-react",
]

// oState 的变化，这些变化上传时不需要查询出原内容
const oState_evts: LiuUploadTask[] = [
  "thread-delete",
  "undo_thread-delete",
  "thread-delete_forever",
  "thread-restore",
  "comment-delete",
  "draft-clear",
]

export function classifyUploadTask(ut: LiuUploadTask) {
  const isContent = content_evts.includes(ut)
  const isWorkspace = workspace_evts.includes(ut)
  const isMember = member_evts.includes(ut)
  const isDraft = draft_evts.includes(ut)
  const isCollection = collection_evts.includes(ut)

  const isOStateChange = oState_evts.includes(ut)

  return {
    isContent,
    isWorkspace,
    isMember,
    isDraft,
    isCollection,
    isOStateChange,
  }
}
