
import type { ThreadShow } from "~/types/types-content";
import commonOperate from "~/components/level1/utils/common-operate";

// 当有状态被添加时
export async function whenThreadInserted(
  newStateId: string,
  thread: ThreadShow
) {
  const oldStateId = thread.stateId
  if(newStateId === oldStateId) return
  const res = await commonOperate.setNewStateForThread(thread, newStateId)
}


interface WtluData {
  stateId: string
  threads: ThreadShow[]
}
let waitList: WtluData[] = []
let waitTimeout = 0
export function whenThreadListUpdated(
  stateId: string,
  threads: ThreadShow[]
) {
  waitList.push({ stateId, threads })
  if(waitTimeout) return
  waitTimeout = setTimeout(() => {
    waitTimeout = 0
    updateStateList()
  }, 300)
}

function updateStateList() {
  console.log("查看 waitList")
  console.log(waitList)
  console.log("waitList 最后记得置空")
}