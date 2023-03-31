import type { ExportType, GetDataOpt } from "./types"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import cfg from "~/config";
import { getData } from "./get-data"
import type { ContentLocalTable } from "~/types/types-table";

export async function handleExport(
  exportType: ExportType
) {
  
  // 1. 先去把数据 contents 加载出来
  console.time("getContents")
  const list = await getContents()
  console.timeEnd("getContents")

  console.log(" ")
  console.log("看一下加载到的 list: ")
  console.log(list)

}


async function getContents() {
  const list: ContentLocalTable[] = []
  const wStore = useWorkspaceStore()
  const spaceId = wStore.spaceId

  // 预防性的计数器，避免陷入疯狂循环
  let runTimes = 0
  const MAX_TIMES = 10

  while(true) {
    let len1 = list.length
    let diff = cfg.max_export_num - len1
    let limit = diff > 16 ? 16 : diff

    const opt: GetDataOpt = {
      spaceId,
      limit,
    }
    if(len1 > 0) {
      opt.lastItemStamp = list[len1 - 1].createdStamp
    }
    const tmpList = await getData(opt)
    list.push(...tmpList)

    const len2 = list.length
    if(len2 >= cfg.max_export_num) break
    if(tmpList.length < 9) break

    if((runTimes++) > MAX_TIMES) break
  }

  return list
}
