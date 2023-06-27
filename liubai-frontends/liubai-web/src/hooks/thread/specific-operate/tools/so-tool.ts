import type { ThreadShow } from "~/types/types-content"
import time from "~/utils/basic/time"
import liuUtil from "~/utils/liu-util"

const setEdit = (
  newThread: ThreadShow
) => {
  const now = time.getTime()
  newThread.editedStamp = now
  newThread.updatedStamp = now
  newThread.editedStr = liuUtil.getEditedStr(newThread.createdStamp, now)
}

export default {
  setEdit
}