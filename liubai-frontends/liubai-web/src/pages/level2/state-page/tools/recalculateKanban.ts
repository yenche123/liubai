// 当 threadShowStore 监听到变化时，重新 check 一下 kanban 的数据
import type { KanbanData } from "./types"
import valTool from "~/utils/basic/val-tool";
import stateController from "~/utils/controllers/state-controller/state-controller";

export async function recalculateKanban(
  kanban: KanbanData,
) {
  // 因为可能 threadShowStore 先发生变化 workspaceStore 还没变化
  // 故等待 300ms 等待尘埃落定
  await valTool.waitMilli(300)

  const stateList = stateController.getStates()

  // 只对视图层进行删除的操作
  // 若是新增数据到模型层，先忽略，引导用户使用刷新按钮

  const { columns } = kanban
  for(let i=0; i<columns.length; i++) {
    const v1 = columns[i]
    const v2 = stateList.find(v => v.id === v1.id)
    if(!v2) continue

    const threads = v1.threads
    const newContentIds = v2.contentIds ?? []
    for(let j=0; j<threads.length; j++) {
      const t = threads[j]
      if(newContentIds.includes(t._id)) continue

      console.log("发现一个视图层的 item 不在模型层里: ")
      console.log(valTool.copyObject(t))
      console.log("去删除...............")
      threads.splice(j, 1)
      j--
    }
  }
}