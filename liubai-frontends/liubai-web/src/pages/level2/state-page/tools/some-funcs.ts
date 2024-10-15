import time from "~/utils/basic/time"
import { db } from "~/utils/db"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { LiuContent } from "~/types/types-atom"
import type { ContentLocalTable } from "~/types/types-table"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import ider from "~/utils/basic/ider"
import { equipThreads } from "~/utils/controllers/equip/threads"
import { setStateForNewThread } from "~/hooks/thread/specific-operate/state"
import { LocalToCloud } from "~/utils/cloud/LocalToCloud"
import liuEnv from "~/utils/liu-env"

export async function addNewThreadToKanban(
  stateId: string,
  inputTxt: string,
) {
  // 1. get current space info
  const wStore = useWorkspaceStore()
  const spaceId = wStore.spaceId
  const spaceType = wStore.spaceType
  const user = wStore.userId
  const member = wStore.memberId
  // member is required because the operation is adding a new thread into a kanban
  if(!spaceType || !spaceId || !user || !member) return

  // 2. package new thread
  const now = time.getTime()
  const liuDesc: LiuContent[] = [
    { 
      content: [{ type: "text", text: inputTxt }], 
      type: "paragraph",
    }
  ]
  const search_other = inputTxt.toLowerCase()
  const newId = ider.createThreadId()
  const canISync = liuEnv.canISync()
  const aThread: ContentLocalTable = {
    _id: newId,
    first_id: newId,
    user,
    member,
    infoType: "THREAD",
    oState: "OK",
    visScope: "DEFAULT",
    storageState: canISync ? "WAIT_UPLOAD" : "LOCAL",
    liuDesc,

    emojiData: { total: 0, system: [] },

    insertedStamp: now,
    createdStamp: now,
    updatedStamp: now,
    editedStamp: now,

    stateId,
    search_other,
    spaceId,
    spaceType,
    levelOne: 0,
    levelOneAndTwo: 0,
  }

  // 3. insert the new thread into db.contents
  const res3 = await db.contents.add(aThread)

  // 4. notify other components
  const threadShows = await equipThreads([aThread])
  await setStateForNewThread(threadShows[0])
  const tStore = useThreadShowStore()
  tStore.setNewThreadShows(threadShows)

  // 5. upload to cloud
  if(!canISync) return
  LocalToCloud.addTask({
    uploadTask: "thread-post", 
    target_id: newId,
    operateStamp: now,
  })
}
