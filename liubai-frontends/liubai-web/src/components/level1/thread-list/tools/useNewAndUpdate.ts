import type { Ref } from "vue";
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"
import type { ThreadShow } from "~/types/types-content"
import type { KanbanStateChange } from "~/hooks/stores/useGlobalStateStore"
import valTool from "~/utils/basic/val-tool";
import type { TlProps, TlViewType } from "./types"
import type { WhyThreadChange } from "~/types/types-atom"
import { handleLastItemStamp } from "./useTLCommon";
import { storeToRefs } from "pinia"
import { watch } from "vue"

export function useNewAndUpdate(
  props: TlProps,
  list: Ref<ThreadShow[]>,
  lastItemStamp: Ref<number>,
) {
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
    const { newThreadShows, updatedThreadShows, whyChange } = state

    if(newThreadShows.length > 0) {
      handleNewList(props, list, newThreadShows, lastItemStamp)
    }
    if(updatedThreadShows.length > 0) {
      handleUpdatedList(props, list, updatedThreadShows, whyChange, lastItemStamp)
    }
  })

  // 监听 "看板状态" 变化
  const gStore = useGlobalStateStore()
  const { kanbanStateChange } = storeToRefs(gStore)
  watch(kanbanStateChange, (newV) => {
    if(!newV) return
    handleKanbanStateChange(props, list, newV)
  })
}

function handleKanbanStateChange(
  props: TlProps,
  listRef: Ref<ThreadShow[]>,
  ksc: KanbanStateChange,
) {
  const list = listRef.value
  const vT = props.viewType as TlViewType
  const inIndex = vT === "INDEX" || vT === "PINNED"

  for(let i=0; i<list.length; i++) {
    const v = list[i]
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
  props: TlProps,
  listRef: Ref<ThreadShow[]>,
  newList: ThreadShow[],
  lastItemStamp: Ref<number>,
) {
  const { tagId, stateId } = props
  const viewType = props.viewType as TlViewType
  const myList = newList.filter(v => {
    const { tagSearched = [] } = v
    // 垃圾桶时
    if(viewType === "TRASH") return v.oState === "REMOVED"

    // 不是垃圾桶时，遇到 REMOVED 直接 false
    if(v.oState === "REMOVED") return false

    if(viewType === "TAG") return tagSearched.includes(tagId)
    if(viewType === "FAVORITE") return v.myFavorite
    if(viewType === "PINNED") return Boolean(v.pinStamp)
    if(viewType === "STATE") {
      if(!v.stateId) return false
      return stateId === v.stateId
    }
    
    return true
  })
  if(myList.length < 1) return
  listRef.value.splice(0, 0, ...myList)

  if(lastItemStamp.value) return
  // 处理 lastItemStamp 为 0 的情况
  const listVal = listRef.value
  handleLastItemStamp(viewType, listVal, lastItemStamp)
}

function handleUpdatedList(
  props: TlProps,
  listRef: Ref<ThreadShow[]>,
  updatedList: ThreadShow[],
  whyChange: WhyThreadChange,
  lastItemStamp: Ref<number>,
) {
  const list = listRef.value
  const vT = props.viewType as TlViewType

  if(vT === "PINNED") {
    handleUpdateForPinnedList(listRef, updatedList)
    return
  }

  const newList = valTool.copyObject(updatedList)
  for(let i=0; i<list.length; i++) {
    let idx = -1
    const v1 = list[i]
    const v2 = newList.find((v, i1) => {
      if(v._id === v1._id) {
        idx = i1
        return true
      }

      // 如果 此时刚上传完动态至远端，那么会有一个短暂的字段 _old_id
      // 若其与 _id 相同，代表是相同的动态
      if(v._old_id && v._old_id === v1._id) {
        idx = i1
        return true
      }
      return false
    })
    if(!v2 || idx < 0) continue

    // 如果当前是首页列表，并且是由 复原置顶 操作所引发的更改，那么去看最新动态是否置顶，若是则移除
    if(vT === "INDEX" && whyChange === "undo_pin") {
      if(Boolean(v2.pinStamp)) {
        list.splice(i, 1)
        i--
        newList.splice(idx, 1)
        continue
      }
    }

    list[i] = v2
    newList.splice(idx, 1)
  }

  // 如果当前为 INDEX 列表 whyChange 是 pin 事件，并且有 unpin 的 thread 
  // 设法把这些 thread 加入到列表里
  if(vT === "INDEX" && whyChange === "pin") {
    _handleIndexListWhenPin(list, newList)
  }

  // handleLastItemStamp(vT, list, lastItemStamp)
}

function _handleIndexListWhenPin(
  list: ThreadShow[],
  newList: ThreadShow[],
) {
  const unpinList = newList.filter(v => !Boolean(v.pinStamp) && Boolean(v.oState === 'OK'))
  if(unpinList.length < 1) return

  for(let i=0; i<unpinList.length; i++) {
    const v0 = unpinList[i]
    for(let j=0; j<list.length; j++) {
      if(j >= (list.length - 1)) break
      const v1 = list[j]
      const v2 = list[j + 1]
      // TODO: 列表是依照时间 "顺序" 由上至下排列的情况，当前仅实现 "逆序" 排列
      if(v1.createdStamp > v0.createdStamp && v0.createdStamp > v2.createdStamp) {
        list.splice(j + 1, 0, v0)
        break
      }
    }
  }
}

// 有动态更新时，特别处理置顶列表
function handleUpdateForPinnedList(
  listRef: Ref<ThreadShow[]>,
  updatedList: ThreadShow[]
) {
  const list = listRef.value
  const newList = valTool.copyObject(updatedList)
  const pinList = newList.filter(v => Boolean(v.pinStamp) && Boolean(v.oState === "OK"))
  const unpinList = newList.filter(v => !Boolean(v.pinStamp) || Boolean(v.oState !== "OK"))

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    let idx = -1
    const inPin = pinList.find((v1, i1) => {
      if(v._id === v1._id) {
        idx = i1
        return true
      }
      if(v1._old_id && v1._old_id === v._id) {
        idx = i1
        return true
      }
      return false
    })
    if(inPin) {
      list[i] = inPin
      pinList.splice(idx, 1)
      continue
    }

    const inUnpin = unpinList.find((v1, i1) => {
      if(v._id === v1._id) {
        idx = i1
        return true
      }
      if(v1._old_id && v1._old_id === v._id) {
        idx = i1
        return true
      }
      return false
    })

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
      const v2 = list[j]
      const p2 = v2.pinStamp ?? 1
      if(p1 > p2) {
        hasInserted = true
        list.splice(j, 0, v1)
        break
      }
    }
    if(!hasInserted) {
      list.push(v1)
    }
  }

}