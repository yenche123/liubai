// 编辑看板、删除看板
import type { WritableComputedRef } from "vue"
import type { KanbanColumn } from "~/types/types-content"
import cui from "~/components/custom-ui"
import { i18n } from "~/locales"
import liuUtil from "~/utils/liu-util"
import stateController from "~/utils/controllers/state-controller/state-controller"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { KanbanStateChange } from "~/hooks/stores/useGlobalStateStore"
import time from "~/utils/basic/time"
import { db } from "~/utils/db"
import dbOp from "~/hooks/thread/db-op"
import threadController from "~/utils/controllers/thread-controller/thread-controller"
import cloudOp from "~/hooks/thread/cloud-op"
import { addNewThreadToKanban } from "./some-funcs"

// 编辑某一栏的看板
// 不提供撤回功能
// 如何更新 thread-list 的动态呢？用 useGlobalState 进行事件传递
async function editKanban(
  columns: WritableComputedRef<KanbanColumn[]>,
  stateId: string,
) {
  const aCol = columns.value.find(v => v.id === stateId)
  if(!aCol) return

  const t = i18n.global.t
  const TODO_TXT = t('thread_related.todo')
  const FINISHED_TXT = t('thread_related.finished')

  let oldTxtKey = aCol.text_key
  let oldText = aCol.text
  let oldColor = liuUtil.colorToStorage(aCol.colorShow)
  let oldShowIndex = aCol.showInIndex
  let oldShowFireworks = Boolean(aCol.showFireworks)
  if(!oldText) {
    if(stateId === "TODO") oldText = TODO_TXT
    else if(stateId === "FINISHED") oldText = FINISHED_TXT
  }

  // 1. 显示 编辑面板
  const res = await cui.showStateEditor({
    mode: "edit",
    text: oldText,
    showInIndex: oldShowIndex,
    showFireworks: oldShowFireworks,
    color: oldColor,
  })
  if(res.action !== "confirm" || !res.data) return
  const rData = res.data
  const { text, showInIndex, color, showFireworks } = rData

  let noChange = text === oldText
  noChange = noChange && showInIndex === oldShowIndex
  noChange = noChange && color === oldColor
  noChange = noChange && showFireworks === oldShowFireworks
  if(noChange) return

  let txtUpdated = text !== oldText

  // 2. 检查是否有一样的状态名 再更新列表
  let hasSame = false
  const stateList = stateController.getStates()
  stateList.forEach(v => {

    // 检查是否有一样的状态名
    if(v.id !== stateId) {
      if(v.text === text) hasSame = true
      else {
        if(v.id === "FINISHED" && FINISHED_TXT === text) {
          hasSame = true
        }
        else if(v.id === "TODO" && TODO_TXT === text) {
          hasSame = true
        }
      }
    }

    // stateId 一致则更新
    if(v.id === stateId) {
      v.updatedStamp = time.getTime()
      v.color = color
      v.showInIndex = showInIndex
      v.showFireworks = showFireworks
      if(txtUpdated) v.text = text
    }
  })
  if(hasSame) {
    cui.showModal({
      title_key: "tip.tip",
      content_key: "state_related.replicate_kanban_name",
      showCancel: false,
    })
    return
  }

  // 3. 更新 workspace db 和 workspaceStore
  const res2 = await stateController.setNewStateList(stateList, {
    speed: "instant",
  })

  const colorShow = liuUtil.colorToShow(color)

  // 4. 使用 gStore 通知全局
  const gStore = useGlobalStateStore()
  const newData: KanbanStateChange = {
    whyChange: "edit",
    stateId,
    stateShow: {
      text: txtUpdated ? text : oldText,
      text_key: oldTxtKey,
      colorShow,
      showInIndex,
      showFireworks,
    }
  }
  gStore.setKanbanStateChange(newData)

  // 5. 更新本地看板视图
  if(txtUpdated) aCol.text = text
  aCol.colorShow = colorShow
  aCol.showInIndex = showInIndex
  aCol.showFireworks = showFireworks

  return true
}


// 删除某栏看板
// 不提供撤回功能，因为改动过大
async function deleteKanban(
  columns: WritableComputedRef<KanbanColumn[]>,
  stateId: string,
) {
  const aIdx = columns.value.findIndex(v => v.id === stateId)
  if(aIdx < 0) return
  const aCol = columns.value[aIdx]

  const t = i18n.global.t
  const TODO_TXT = t('thread_related.todo')
  const FINISHED_TXT = t('thread_related.finished')

  let oldText = aCol.text
  if(!oldText) {
    if(stateId === "TODO") oldText = TODO_TXT
    else if(stateId === "FINISHED") oldText = FINISHED_TXT
  }

  // 1. 检查 state 个数
  const stateList = stateController.getStates()
  if(stateList.length <= 2) {
    cui.showModal({
      title_key: "tip.tip",
      content_key: "state_related.min_kanban",
      showCancel: false,
    })
    return
  }

  // 2. 弹窗确认
  const res = await cui.showModal({
    title_key: "state_related.delete_h1",
    title_opt: { name: oldText },
    content_key: "state_related.delete_b1",
    confirm_key: "common.delete",
    modalType: "warning"
  })
  if(!res.confirm) return

  // 3. 删除 workspace 里的 state
  for(let i=0; i<stateList.length; i++) {
    const v = stateList[i]
    if(v.id === stateId) {
      stateList.splice(i, 1)
      i--
    }
  }
  const res2 = await stateController.setNewStateList(stateList)

  // 4. 更新 db.contents
  const res3 = await _updateThreadsWhenDeleteState(stateId)
  if(!res3) {
    _showErr()
    return
  }

  // 5. 使用 gStore 通知全局
  const gStore = useGlobalStateStore()
  const newData: KanbanStateChange = {
    whyChange: "delete",
    stateId,
  }
  gStore.setKanbanStateChange(newData)

  // 6. 更新本地视图
  columns.value.splice(aIdx, 1)

  return true
}

// 添加动态至某栏看板里
// 允许添加 "不在该栏看板中，但已是该状态的动态"
async function addThreadToKanban(
  columns: WritableComputedRef<KanbanColumn[]>,
  stateId: string,
) {
  const aCol = columns.value.find(v => v.id === stateId)
  if(!aCol) return

  // 1. 搜索要添加哪个动态
  const excludeThreads = aCol.threads.map(v => v._id)
  const res = await cui.showSearchEditor({ type: "select_thread", excludeThreads })

  // 1.2 addd new thread instantly
  const { action, threadId, inputTxt } = res
  if(action === "confirm" && inputTxt) {
    addNewThreadToKanban(stateId, inputTxt)
    return
  }
  if(action !== "confirm" || !threadId) return

  // 2. 先把已在 kanban 里的该 thread 删除，再添加到 kanban 为 stateId 的第一项
  const stateList = stateController.getStates()
  stateList.forEach(v1 => {
    let { contentIds } =  v1
    if(contentIds) {
      contentIds = contentIds.filter(v2 => v2 !== threadId)
    }
    if(v1.id === stateId) {
      if(!contentIds) contentIds = []
      contentIds.unshift(threadId)
    }
    v1.contentIds = contentIds
  })

  // 3. 发起更新 stateList
  const res2 = await stateController.setNewStateList(stateList, {
    speed: "slow",
  })

  // 4. 更新 content
  const res3 = await dbOp.setStateId(threadId, stateId)

  // 5. 加载该 thread
  const newThread = await threadController.getData({ id: threadId })
  if(!newThread) return

  // 6. 使用 useThreadShowStore 通知全局
  const tStore = useThreadShowStore()
  tStore.setUpdatedThreadShows([newThread], "state")

  // 7. just upload content because workspace has been uploaded
  //   in stateController.setNewStateList
  cloudOp.saveContentToCloud(newThread, newThread.updatedStamp)
}


function _showErr() {
  cui.showModal({
    title_key: "tip.fail_to_operate",
    content_key: "tip.try_again_later",
    showCancel: false
  })
}

// TODO: 向云端批量更新 contents 的 stateId 
async function _updateThreadsWhenDeleteState(
  stateId: string
) {

  let modifiedObj = {
    stateId: undefined,
    updatedStamp: time.getTime()
  }

  let res: any
  try {
    res = await db.contents.where({ stateId }).modify(modifiedObj)
  }
  catch(err) {
    console.log("modify 失败........")
    console.log(err)
    console.log(" ")
    return false
  }

  console.log("modify 成功........")
  console.log(res)
  console.log(" ")

  return true
}



export default {
  editKanban,
  deleteKanban,
  addThreadToKanban,
}