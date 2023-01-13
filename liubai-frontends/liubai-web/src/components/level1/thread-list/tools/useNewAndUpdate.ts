import type { Ref } from "vue";
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import type { ThreadShow } from "~/types/types-content"
import valTool from "~/utils/basic/val-tool";
import type { TlProps, TlViewType } from "./types"

export function useNewAndUpdate(
  props: TlProps,
  list: Ref<ThreadShow[]>
) {
  const tStore = useThreadShowStore()
  tStore.$subscribe((mutation, state) => {
    // console.log("thread-list 收到有 threadShow 发生变化!")
    // console.log("type: ", mutation.type)
    // console.log("storeId: ", mutation.storeId)
    // console.log("events: ", mutation.events)
    // console.log("newList: ")
    // console.log(state.newThreadShows)
    // console.log("updatedList: ")
    // console.log(state.updatedThreadShows)
    // console.log(" ")
    const { newThreadShows, updatedThreadShows } = state

    if(newThreadShows.length > 0) handleNewList(props, list, newThreadShows)
    if(updatedThreadShows.length > 0) handleUpdatedList(props, list, updatedThreadShows)
  })
}

function handleNewList(
  props: TlProps,
  listRef: Ref<ThreadShow[]>,
  newList: ThreadShow[]
) {
  const { tagId } = props
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
    
    return true
  })
  if(myList.length < 1) return
  listRef.value.splice(0, 0, ...myList)
}

function handleUpdatedList(
  props: TlProps,
  listRef: Ref<ThreadShow[]>,
  updatedList: ThreadShow[]
) {
  const list = listRef.value
  const viewType = props.viewType as TlViewType

  if(viewType === "PINNED") {
    handleUpdateForPinnedList(listRef, updatedList)
    return
  }

  for(let i=0; i<list.length; i++) {
    const v1 = list[i]
    const v2 = updatedList.find(v => {
      if(v._id === v1._id) return true

      // 如果 此时刚上传完动态至远端，那么会有一个短暂的字段 _old_id
      // 若其与 _id 相同，代表是相同的动态
      if(v._old_id && v._old_id === v1._id) return true
      return false
    })
    if(!v2) continue
    list[i] = v2
  }
}

// 有动态更新时，特别处理置顶列表
function handleUpdateForPinnedList(
  listRef: Ref<ThreadShow[]>,
  updatedList: ThreadShow[]
) {
  const list = listRef.value
  const newList = valTool.copyObject(updatedList)
  const pinList = newList.filter(v => Boolean(v.pinStamp))
  const unpinList = newList.filter(v => !Boolean(v.pinStamp))

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