
import type { ThreadShow } from "~/types/types-content";
import threadOperate from "~/hooks/thread/thread-operate";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import stateController from "~/utils/controllers/state-controller/state-controller";
import type { LiuTimeout } from "~/utils/basic/type-tool";
import valTool from "~/utils/basic/val-tool";

interface CrossData {
  stateId: string
  threadId: string
}

// 被移动到其他 column 的 id
let crossData: CrossData | null = null

// 当有状态被添加时
export async function whenThreadInserted(
  newStateId: string,
  thread: ThreadShow
) {

  console.log("有动态被添加到 kanban 里了...................")
  const oldStateId = thread.stateId
  crossData = {
    stateId: newStateId,
    threadId: thread._id,
  }
  
  if(newStateId === oldStateId) return
  const res = await threadOperate.setNewStateForThread(thread, newStateId)
  if(res) thread.stateId = newStateId
}


interface WtluData {
  stateId: string
  threads: ThreadShow[]
}
let waitList: WtluData[] = []
let waitTimeout: LiuTimeout
export function whenThreadListUpdated(
  stateId: string,
  threads: ThreadShow[]
) {
  waitList.push({ stateId, threads })
  if(waitTimeout) return
  waitTimeout = setTimeout(() => {
    waitTimeout = undefined
    updateStateList()
  }, 300)
}

async function updateStateList() {
  if(waitList.length < 1) return

  const wStore = useWorkspaceStore()
  const currentSpace = wStore.currentSpace
  if(!currentSpace) return false


  console.log("有 kanban 被更新了...............")

  const stateList = stateController.getStates()
  for(let i=0; i<stateList.length; i++) {
    const v1 = stateList[i]
    const v2 = waitList.find(v => v1.id === v.stateId)
    if(!v2) continue

    const oldContentIds = v1.contentIds ?? []
    const newContentIds = v2.threads.map(v => v._id)
    let contentIds: string[] = []

    for(let j=0; j<oldContentIds.length; j++) {
      const t1 = oldContentIds[j]
      const t2 = newContentIds[0]

      // t1 已于 contentId 中
      if(contentIds.includes(t1)) {
        continue
      }

      if(t1 && t1 === t2) {
        // 位置一样
        contentIds.push(t2)
        newContentIds.splice(0, 1)
        continue
      }

      // 读到旧的 id 被跨栏移动，代表不应该出现在该 column 里
      if(t1 && t1 === crossData?.threadId) {
        continue
      }

      // 读到新的 id 被跨栏移动，代表它就应该出现在这里
      // 这时要 j-- 因为下一轮还要再从此刻的 t1 开始
      if(t2 && t2 === crossData?.threadId) {
        contentIds.push(t2)
        newContentIds.splice(0, 1)
        j--
        continue
      }

      // 检查 t1 有没有在 newContentIds 里
      // 如果没有，就代表是其他端的动态，请为它保留
      if(t1 && !newContentIds.includes(t1)) {
        contentIds.push(t1)
        continue
      }

      // 以上情况都不符合，则以 newContentIds 为准
      contentIds.push(t2)
      newContentIds.splice(0, 1)
    }

    if(newContentIds.length > 0) {
      contentIds = contentIds.concat(newContentIds)
    }
    contentIds = valTool.uniqueArray(contentIds)
    
    v1.contentIds = contentIds
  }


  waitList = []
  crossData = null

  const res = await stateController.setNewStateList(stateList)
}
