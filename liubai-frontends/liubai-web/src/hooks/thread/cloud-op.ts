import type { ThreadShow } from "~/types/types-content"
import type { LiuUploadTask } from "~/types/types-atom"
import { LocalToCloud } from "~/utils/cloud/LocalToCloud"
import time from "~/utils/basic/time"
import liuUtil from "~/utils/liu-util"

function saveContentToCloud(
  thread: ThreadShow,
  stamp: number,
  isUndo: boolean = false,
) {
  const ss = thread.storageState
  const isLocal = liuUtil.check.isLocalContent(ss)
  if(isLocal) return

  LocalToCloud.addTask({
    uploadTask: isUndo ? "undo_thread-state" : "thread-state",
    target_id: thread._id,
    operateStamp: stamp,
  })
}

function saveWorkspaceToCloud(
  workspace_id: string,
  isUndo: boolean = false,
) {
  let uploadTask: LiuUploadTask = "workspace-state_config"
  if(isUndo) uploadTask = "undo_workspace-state_config"
  LocalToCloud.addTask({
    uploadTask,
    target_id: workspace_id,
    operateStamp: time.getTime(),
  })
}

export default {
  saveContentToCloud,
  saveWorkspaceToCloud,
}