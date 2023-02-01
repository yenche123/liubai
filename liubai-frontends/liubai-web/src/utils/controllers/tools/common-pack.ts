import type { LiuContent } from "~/types/types-atom";
import type { LiuFileStore } from "~/types"
import type { StateShow } from "~/types/types-content"
import { getBriefing } from "./briefing"
import { listToText } from "~/utils/transfer-util/text";
import type { WorkspaceStore } from "~/hooks/stores/useWorkspaceStore"

/**
 * 判断有没有 title，若有加到 content 里
 */
function packLiuDesc(
  liuDesc: LiuContent[] | undefined,
  title?: string,
) {
  if(!title) return liuDesc
  let newDesc = liuDesc ? JSON.parse(JSON.stringify(liuDesc)) as LiuContent[] : []
  const h1: LiuContent = {
    type: "heading",
    attrs: {
      level: 1,
    },
    content: [
      {
        "type": "text",
        "text": title
      }
    ]
  }
  newDesc.splice(0, 0, h1)
  return newDesc
}

/**
 * 生成 summary 字段，用于看板的卡片以及搜索结果的文字
 */
function getSummary(
  content: LiuContent[] | undefined,
  files: LiuFileStore[] | undefined,
) {
  let text = ""
  if(content && content.length > 0) {
    text = listToText(content)
    text = text.replace(/\n/g, " ")
    text = text.trim()
    if(text.length > 140) text = text.substring(0, 140)
    if(text) return text
  }

  if(files && files.length > 0) {
    text = files[0].name
    if(text.length > 140) text = text.substring(0, 140)
    return files[0].name
  }

  return text
}

function getStateShow(
  stateId: string | undefined,
  wStore: WorkspaceStore,
): StateShow | undefined {
  if(!stateId) return

  const { currentSpace } = wStore
  if(!currentSpace) return
  const { stateConfig } = currentSpace
  if(!stateConfig) return
  const { stateList } = stateConfig
  const stateData = stateList.find(v => v.id === stateId)
  if(!stateData) return

  // 处理文字
  let text_key = ""
  let text = stateData.text
  if(!text) {
    if(stateId === "TODO") text_key = "thread_related.todo"
    else if(stateId === "FINISHED") text_key = "thread_related.finished"
  }
  if(!text && !text_key) return

  // 处理颜色
  let color = stateData.color
  if(!color) {
    if(stateId === "TODO") color = "--liu-state-1"
    else if(stateId === "FINISHED") color = "--liu-state-2"
  }
  if(!color) return
  if(color.includes("--liu-state")) color = `var(${color})`

  let obj: StateShow = {
    text,
    text_key,
    color,
  }

  return obj
}


export default {
  packLiuDesc,
  getBriefing,
  getSummary,
  getStateShow,
}