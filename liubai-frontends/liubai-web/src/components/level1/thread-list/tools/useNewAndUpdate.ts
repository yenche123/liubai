import { Ref } from "vue";
import { useThreadShowStore } from "../../../../hooks/stores/useThreadShowStore";
import type { ThreadShow } from "../../../../types/types-content"


export function useNewAndUpdate(
  list: Ref<ThreadShow[]>
) {
  const store = useThreadShowStore()
  store.$subscribe((mutation, state) => {
    console.log("thread-list 收到有 threadShow 发生变化!")
    console.log("type: ", mutation.type)
    console.log("storeId: ", mutation.storeId)
    console.log("events: ", mutation.events)
    console.log("newList: ")
    console.log(state.newThreadShows)
    console.log("updatedList: ")
    console.log(state.updatedThreadShows)
    console.log(" ")
    const { newThreadShows, updatedThreadShows } = state
    if(newThreadShows.length > 0) handleNewList(list, newThreadShows)
    if(updatedThreadShows.length > 0) handleUpdatedList(list, updatedThreadShows)
  })
}

function handleNewList(
  listRef: Ref<ThreadShow[]>,
  newList: ThreadShow[]
) {
  listRef.value.splice(0, 0, ...newList)
}

function handleUpdatedList(
  listRef: Ref<ThreadShow[]>,
  updatedList: ThreadShow[]
) {

}