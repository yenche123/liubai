import { Ref } from "vue";
import { useThreadShowStore } from "../../../../hooks/stores/useThreadShowStore";
import type { ThreadShow } from "../../../../types/types-content"
import type { TlProps, TlViewType } from "./types"

export function useNewAndUpdate(
  props: TlProps,
  list: Ref<ThreadShow[]>
) {
  const store = useThreadShowStore()
  store.$subscribe((mutation, state) => {
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
  const { tagId } = props
  const viewType = props.viewType as TlViewType

  const list = listRef.value
  for(let i=0; i<list.length; i++) {
    const v1 = list[i]
    const v2 = updatedList.find(v => v._id === v1._id)
    if(!v2) continue

    // 先把要移除的部分处理了，最后就整个赋值

    // 垃圾桶时
    if(viewType === "TRASH" && v2.oState === "OK") {
      list.splice(i, 1)
      i--
      continue
    }

    // 不是垃圾桶时
    if(viewType !== "TRASH" && v2.oState !== "OK") {
      list.splice(i, 1)
      i--
      continue
    }

    // 当前为 标签
    if(viewType === "TAG") {
      const hasTag = (v2.tagSearched ?? []).includes(tagId)
      if(!hasTag) {
        list.splice(i, 1)
        i--
        continue
      }
    }

    // 当前为 收藏
    if(viewType === "FAVORITE" && !v2.myFavorite) {
      list.splice(i, 1)
      i--
      continue
    }

    // 当前为 置顶
    if(viewType === "PINNED" && !Boolean(v2.pinStamp)) {
      list.splice(i, 1)
      i--
      continue
    }

    list[i] = v2
  }

}