import { ThreadShow } from "~/types/types-content"
import type { ExportType } from "./types"
import threadController from "~/utils/controllers/thread-controller/thread-controller";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { TcListOption } from "~/utils/controllers/thread-controller/type"
import cfg from "~/config";


export async function handleExport(
  exportType: ExportType
) {
  
  // 1. 先去把数据 ThreadShow 加载出来
  console.time("getThreadShows")
  const list = await getThreadShows()
  console.timeEnd("getThreadShows")

  console.log(" ")
  console.log("看一下加载到的 list: ")
  console.log(list)

}


async function getThreadShows() {
  const list: ThreadShow[] = []
  const wStore = useWorkspaceStore()
  const spaceId = wStore.spaceId

  // 预防性的计数器，避免陷入疯狂循环
  let runTimes = 0
  const MAX_TIMES = 10

  while(true) {

    const opt: TcListOption = {
      spaceId,
      onlyLocal: true,
      viewType: "",
    }
    const len1 = list.length
    if(len1 > 0) {
      opt.lastItemStamp = list[len1 - 1].createdStamp
    }
    const tmpList = await threadController.getList(opt)
    list.push(...tmpList)

    const len2 = list.length
    if(len2 >= cfg.max_export_num) break
    if(tmpList.length < 9) break

    if((runTimes++) > MAX_TIMES) break
  }

  return list
}