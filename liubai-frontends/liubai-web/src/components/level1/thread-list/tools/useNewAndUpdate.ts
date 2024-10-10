import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { useCommentStore } from "~/hooks/stores/useCommentStore";
import type { CommentStoreState } from "~/hooks/stores/useCommentStore";
import type { ThreadShow } from "~/types/types-content";
import type { KanbanStateChange } from "~/hooks/stores/useGlobalStateStore";
import valTool from "~/utils/basic/val-tool";
import type { TlData, TlEmits, TlProps } from "./types";
import type { ThreadChangedFrom, WhyThreadChange } from "~/types/types-atom";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { filterForCalendar } from "./handle-calendar";
import tlUtil from "./tl-util";
import cfg from "~/config";

interface TlNuCtx {
  props: TlProps,
  emit: TlEmits
  tlData: TlData
}

export function useNewAndUpdate(
  props: TlProps,
  emit: TlEmits,
  tlData: TlData,
) {
  const ctx: TlNuCtx = { props, emit, tlData }

  // listen to threadShow changing
  const tStore = useThreadShowStore()
  tStore.$subscribe((mutation, state) => {
    // console.log(`${props.viewType} thread-list 收到有 threadShow 发生变化!`)
    // console.log("type: ", mutation.type)
    // console.log("storeId: ", mutation.storeId)
    // console.log("events: ", mutation.events)
    // console.log("newList: ")
    // console.log(state.newThreadShows)
    // console.log("updatedList: ")
    // console.log(state.updatedThreadShows)
    // console.log(" ")
    const { 
      newThreadShows, 
      updatedThreadShows, 
      whyChange, 
      changeFrom 
    } = state

    if(newThreadShows.length > 0) {
      handleNewList(ctx, newThreadShows)
    }
    if(updatedThreadShows.length > 0) {
      handleUpdatedList(ctx, updatedThreadShows, whyChange, changeFrom)
    }
  })

  // 监听 "看板状态" 变化
  const gStore = useGlobalStateStore()
  const { kanbanStateChange } = storeToRefs(gStore)
  watch(kanbanStateChange, (newV) => {
    if(!newV) return
    handleKanbanStateChange(props, tlData, newV)
  })

  // 监听 comment 发生变化
  // 若情况符合，对 thread 的 commentNum 进行修改
  const cStore = useCommentStore()
  cStore.$subscribe((mutation, state) => {
    handleCommentChange(tlData, state)
  })
}

function handleCommentChange(
  tlData: TlData,
  state: CommentStoreState,
) {
  const { list } = tlData
  const {
    commentId,
    changeType,
    parentThread,
    parentComment,
    replyToComment
  } = state

  if(!changeType || !commentId) return

  for(let i=0; i<list.length; i++) {
    const v = list[i].thread
    if(v._id !== parentThread) continue
    if(changeType === "edit" || changeType === "operate") return

    let num = v.commentNum

    // 判断是否为 thread 两级内的评论
    if(!replyToComment || parentComment === replyToComment) {
      if(changeType === "add") num++
      else if(changeType === "delete") num--
    
      if(num < 0) num = 0
      v.commentNum = num
    }
  }
}


function handleKanbanStateChange(
  props: TlProps,
  tlData: TlData,
  ksc: KanbanStateChange,
) {
  const { list } = tlData
  const vT = props.viewType
  const inIndex = vT === "INDEX" || vT === "PINNED" || vT === "CALENDAR"

  for(let i=0; i<list.length; i++) {
    const v = list[i].thread
    if(v.stateId !== ksc.stateId) continue

    if(ksc.whyChange === "delete") {
      v.stateId = undefined
      v.stateShow = undefined
    }
    else if(ksc.whyChange === "edit") {
      v.stateShow = ksc.stateShow

      if(inIndex && ksc.stateShow?.showInIndex === false) {
        list.splice(i, 1)
        i--
        continue
      }
    }

  }

}


function handleNewList(
  ctx: TlNuCtx,
  newList: ThreadShow[],
) {
  const { tlData, props } = ctx
  const { tagId, stateId, viewType: vT } = props

  console.log("handleNewList vT: ", vT)
  console.log(newList)
  console.log(" ")


  const myList = newList.filter(v => {
    const { tagSearched = [], oState } = v
    // 垃圾桶时
    if(vT === "TRASH") return oState === "REMOVED"

    // 不是垃圾桶时，遇到 REMOVED 直接 false
    if(oState === "REMOVED" || oState === "DELETED") return false

    if(vT === "TAG") return tagSearched.includes(tagId)
    if(vT === "FAVORITE") return v.myFavorite
    if(vT === "PINNED") return Boolean(v.pinStamp)
    if(vT === "CALENDAR") return Boolean(v.calendarStamp)
    if(vT === "STATE") {
      if(!v.stateId) return false
      return stateId === v.stateId
    }
    
    return true
  })
  if(myList.length < 1) return


  if(vT === "CALENDAR") {
    handleNewListForCalendar(ctx, myList)
    return
  }

  const _myList = tlUtil.threadShowsToList(myList)
  tlData.list.splice(0, 0, ..._myList)

  if(tlData.lastItemStamp) return
  // 处理 lastItemStamp 为 0 的情况
  tlUtil.handleLastItemStamp(vT, tlData)
}


function handleNewListForCalendar(
  ctx: TlNuCtx,
  results: ThreadShow[],
) {
  const { tlData, emit } = ctx
  const oldList = tlData.list

  const { 
    list: tmpList, 
    title_key,
  } = filterForCalendar(results)

  if(tmpList.length < 1) return
  const newList = tlUtil.threadShowsToList(tmpList)

  if(oldList.length < 1) {
    tlData.list = newList
    emit("hasdata", { title_key })
    return
  }

  for(let i=0; i<newList.length; i++) {
    const v0 = newList[i]
    const v1 = v0.thread
    const c1 = v1.calendarStamp ?? 1

    let hasAdded = false
    for(let j=0; j<oldList.length; j++) {
      const v2 = oldList[j].thread
      const c2 = v2.calendarStamp ?? 1
      if(c1 < c2) {
        hasAdded = true
        oldList.splice(j, 0, v0)
        break
      }
    }

    if(!hasAdded) {
      oldList.push(v0)
    }
  }
}

function handleUpdatedList(
  ctx: TlNuCtx,
  updatedList: ThreadShow[],
  whyChange: WhyThreadChange,
  changeFrom?: ThreadChangedFrom,
) {
  const { props, tlData } = ctx
  const { list } = tlData
  const vT = props.viewType

  // 1. 检查是否有无需监听变化的修改
  const NO_ACTIONS: WhyThreadChange[] = [
    "float_up", 
    "undo_float_up",
  ]
  const isInNoActions = NO_ACTIONS.includes(whyChange)
  if(isInNoActions) return

  // 2. 如果当前列表为 "置顶"，另外处理
  if(vT === "PINNED") {
    _handleUpdateForPinnedList(tlData, updatedList)
    return
  }

  const newList = valTool.copyObject(updatedList)
  for(let i=0; i<list.length; i++) {
    let idx = -1
    const v1 = list[i].thread
    const v2 = newList.find((v, i1) => {
      if(v._id === v1._id) {
        idx = i1
        return true
      }

      // 若现有的动态两个 id 一致，并且发生变化的动态的 first_id 也与其一致
      if(v1._id === v1.first_id && v.first_id === v1.first_id) {
        idx = i1
        return true
      }

      return false
    })
    if(!v2 || idx < 0) continue

    // 如果当前是首页列表，并且是由 复原置顶 操作所引发的更改
    if(vT === "INDEX" && whyChange === "undo_pin") {
      // 那么去看最新动态是否置顶，若是则移除
      if(Boolean(v2.pinStamp)) {
        list.splice(i, 1)
        i--
        newList.splice(idx, 1)
        continue
      }
    }

    list[i].thread = v2
    newList.splice(idx, 1)
  }

  // 如果当前为 INDEX 列表 whyChange 是 pin 事件，并且有 unpin 的 thread 
  // 设法把这些 thread 加入到列表里
  if(vT === "INDEX" && whyChange === "pin") {
    _handleIndexListWhenPin(tlData, newList, changeFrom)
    return
  }

}

function _handleIndexListWhenPin(
  tlData: TlData,
  newList: ThreadShow[],
  changeFrom?: ThreadChangedFrom,
) {

  // 检查是否有 “被取消指定” 的动态
  const unpinList = newList.filter(v => !Boolean(v.pinStamp) && Boolean(v.oState === 'OK'))
  if(unpinList.length >= 1) {
    _handleIndexListForUnpin(tlData, unpinList)
    return
  }
  
  // TODO: 当用户在 detail 里置顶动态，检查 INDEX 列表
  //   从中把被置顶的动态移除
  // 难点: 如果用户 “撤销了置顶”，如何再把动态加回 INDEX 中？
}

/**
 * 当 “取消置顶” 发生时，处理 index 列表
 */
function _handleIndexListForUnpin(
  tlData: TlData,
  unpinList: ThreadShow[],
) {
  const { list } = tlData

  // 2. 判断是否使用 “刷新” 加载
  // 如果当前首页列表的个数小于等于 默认动态数
  // 直接采用加载的方式去刷新
  if(list.length <= cfg.default_limit_num) {
    tlData.requestRefreshNum++
    return
  }

  // 3. 采用 “插入” 动态的方式
  // 把 “被取消指定” 的动态加回去
  for(let i=0; i<unpinList.length; i++) {
    const v0 = unpinList[i]
    for(let j=0; j<list.length; j++) {
      if(j >= (list.length - 1)) break
      const v1 = list[j].thread
      const v2 = list[j + 1].thread
      // TODO: 列表是依照时间 "顺序" 由上至下排列的情况，当前仅实现 "逆序" 排列
      if(v1.createdStamp > v0.createdStamp && v0.createdStamp > v2.createdStamp) {
        list.splice(j + 1, 0, tlUtil.threadShowToItem(v0))
        break
      }
    }
  }
}

// 有动态更新时，特别处理置顶列表
function _handleUpdateForPinnedList(
  tlData: TlData,
  updatedList: ThreadShow[],
) {
  const { list } = tlData
  const newList = valTool.copyObject(updatedList)
  const pinList = newList.filter(v => Boolean(v.pinStamp) && Boolean(v.oState === "OK"))
  const unpinList = newList.filter(v => !Boolean(v.pinStamp) || Boolean(v.oState !== "OK"))

  for(let i=0; i<list.length; i++) {
    const v = list[i].thread

    let idx = -1
    const _findItem = (v1: ThreadShow, i1: number) => {
      if(v._id === v1._id) {
        idx = i1
        return true
      }
      if(v._id === v.first_id && v1.first_id === v.first_id) {
        idx = i1
        return true
      }
      return false
    }

    const inPin = pinList.find(_findItem)
    if(inPin) {
      list[i].thread = inPin
      pinList.splice(idx, 1)
      continue
    }

    const inUnpin = unpinList.find(_findItem)
    if(inUnpin) {
      list.splice(i, 1)
      i--
      unpinList.splice(idx, 1)
    }
  }

  if(pinList.length < 1) return

  // 将未置入 list 的 pinList 排序后放入其中
  for(let i=0; i<pinList.length; i++) {
    const v1 = pinList[i]
    const p1 = v1.pinStamp as number
    let hasInserted = false
    for(let j=0; j<list.length; j++) {
      const v2 = list[j].thread
      const p2 = v2.pinStamp ?? 1
      if(p1 > p2) {
        hasInserted = true
        list.splice(j, 0, tlUtil.threadShowToItem(v1))
        break
      }
    }
    if(!hasInserted) {
      list.push(tlUtil.threadShowToItem(v1))
    }
  }

}