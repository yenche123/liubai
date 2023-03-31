import type { ExportType, GetDataOpt } from "./types"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import cfg from "~/config";
import { getData } from "./get-data"
import type { ContentLocalTable } from "~/types/types-table";
import JSZip from "jszip";
import cui from "~/components/custom-ui";
import liuUtil from "~/utils/liu-util";
import time from "~/utils/basic/time";
import { membersToShows } from "~/utils/other/member-related";
import { saveAs as fileSaverSaveAs } from 'file-saver';

export async function handleExport(
  exportType: ExportType
) {

  // 0. 获取工作区状态
  const wStore = useWorkspaceStore()
  const { spaceId, myMember } = wStore
  if(!spaceId || !myMember) return
  const [m] = membersToShows([myMember])
  
  // 1. 先去把数据 contents 加载出来
  console.time("getContents")
  const list = await getContents(spaceId)
  console.timeEnd("getContents")

  console.log(" ")
  console.log("看一下加载到的 list: ")
  console.log(list)
  console.log(" ")

  if(list.length < 1) {
    cui.showModal({ 
      title_key: "tip.tip", 
      content_key: "export.no_data", 
      showCancel: false
    })
    return
  }

  const zip = new JSZip()

  // 1. 生成 metadata
  const appName = liuUtil.getEnv().APP_NAME ?? ""
  const metadata = {
    appName,
    version: LIU_ENV.version,
    client: LIU_ENV.client,
    export_num: list.length,
    export_stamp: time.getTime(),
    operator: m.name ?? "",
  }
  zip.file("metadata.json", JSON.stringify(metadata, null, 2))

  console.time("resZip")
  const resZip = await zip.generateAsync({ type: "blob" })
  console.timeEnd("resZip")

  let fileName = exportType === "json" ? `${appName}-json.zip` : `${appName}-markdown.zip`

  console.time("fileSaverSaveAs")
  fileSaverSaveAs(resZip, fileName)
  console.timeEnd("fileSaverSaveAs")
}


async function getContents(spaceId: string) {
  const list: ContentLocalTable[] = []

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
