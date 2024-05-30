import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { TagView } from "~/types/types-atom";
import time from "~/utils/basic/time";
import { LocalToCloud } from "~/utils/cloud/LocalToCloud";

/** set tagList locally and remotely */
export async function toSetTagList(list: TagView[]) {
  const wStore = useWorkspaceStore()
  const spaceId = wStore.spaceId
  if(!spaceId) return false
  const res = await wStore.setTagList(list)
  LocalToCloud.addTask({ 
    target_id: spaceId, 
    uploadTask: "workspace-tag",
    operateStamp: time.getTime()
  })
  return res
}