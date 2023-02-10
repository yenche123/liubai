// 编辑看板、删除看板
import type { WritableComputedRef } from "vue"
import type { KanbanColumn } from "~/types/types-content"
import cui from "~/components/custom-ui"
import { i18n } from "~/locales"
import liuUtil from "~/utils/liu-util"
import stateController from "~/utils/controllers/state-controller/state-controller"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"
import type { KanbanStateChange } from "~/hooks/stores/useGlobalStateStore"
import time from "~/utils/basic/time"

// 编辑某一栏的看板，也不提供撤回功能
// 如何更新 thread-list 的动态呢？用 useGlobalState 进行事件传递
async function editKanban(
  columns: WritableComputedRef<KanbanColumn[]>,
  stateId: string,
) {
  const aCol = columns.value.find(v => v.id === stateId)
  if(!aCol) return

  const t = i18n.global.t
  let oldTxtKey = aCol.text_key
  let oldText = aCol.text
  let oldColor = liuUtil.colorToStorage(aCol.colorShow)
  let oldShowIndex = aCol.showInIndex
  if(!oldText) {
    if(stateId === "TODO") oldText = t('thread_related.todo')
    else if(stateId === "FINISHED") oldText = t('thread_related.finished')
  }

  // 1. 显示 编辑面板
  const res = await cui.showStateEditor({
    mode: "edit",
    text: oldText,
    showInIndex: oldShowIndex,
    color: oldColor,
  })
  if(res.action !== "confirm" || !res.data) return
  const rData = res.data
  const { text, showInIndex, color } = rData
  if(text === oldText && showInIndex === oldShowIndex && color === oldColor) return

  let txtUpdated = text !== oldText

  // 2.去更新 wStore 和 workspace 的 db
  const stateList = stateController.getStates()
  stateList.forEach(v => {
    if(v.id === stateId) {
      v.updatedStamp = time.getTime()
      v.color = color
      v.showInIndex = showInIndex
      if(txtUpdated) v.text = text
    }
  })
  const res2 = await stateController.setNewStateList(stateList)

  const colorShow = liuUtil.colorToShow(color)

  // 3. 使用 gStore 通知全局
  const gStore = useGlobalStateStore()
  const newData: KanbanStateChange = {
    whyChange: "edit",
    stateId,
    stateShow: {
      text: txtUpdated ? text : oldText,
      text_key: oldTxtKey,
      colorShow,
      showInIndex,
    }
  }
  gStore.setKanbanStateChange(newData)

  // 4. 更新本地看板视图
  if(txtUpdated) aCol.text = text
  aCol.colorShow = colorShow
  aCol.showInIndex = showInIndex

  return true
}


// 不提供撤回功能，因为改动过大
async function deleteKanban(
  columns: WritableComputedRef<KanbanColumn[]>,
  stateId: string,
) {

}



export default {
  editKanban,
  deleteKanban,
}