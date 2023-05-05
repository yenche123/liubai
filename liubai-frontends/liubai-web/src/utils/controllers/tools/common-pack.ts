import type { LiuContent } from "~/types/types-atom";
import type { LiuFileStore } from "~/types"
import type { StateShow } from "~/types/types-content"
import { getBriefing } from "./briefing"
import { listToText } from "~/utils/transfer-util/text";
import type { WorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import valTool from "~/utils/basic/val-tool";
import { addSomethingWhenBrowsing } from "./show-content"

/**
 * 判断有没有 title，若有加到 content 里
 */
function packLiuDesc(
  liuDesc: LiuContent[] | undefined,
  title?: string,
) {
  let newDesc = liuDesc ? valTool.copyObject(liuDesc) : []
  newDesc = addSomethingWhenBrowsing(newDesc)

  if(!title) return newDesc
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
 * 不包含 title
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
    return `[${text}]`
  }

  return text
}

function getStateShow(
  stateId: string | undefined,
  wStore: WorkspaceStore,
): StateShow | undefined {
  if(!stateId) return

  const stateList = wStore.getStateList()
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
    colorShow: color,
    showInIndex: stateData.showInIndex,
    showFireworks: stateData.showFireworks,
  }

  return obj
}


export default {
  packLiuDesc,
  getBriefing,
  getSummary,
  getStateShow,
}