import { ref } from "vue";
import type { Ref } from "vue";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";

export function useWhoAreYou() {
  const store = useWorkspaceStore()
  const show = ref(false)
  const inputValue = ref("")

  store.$subscribe((mutation, state) => {
    const myMember = state.myMember
    // console.log("看一下 myMember: ", myMember)
    // console.log(" ")
    if(!myMember) return
    if(!myMember.name) _open(show)
  })

  const onEnter = () => {
    const val = inputValue.value.trim()
    if(!val) return
    store.setNickName(val)
    _close(show)
  }

  return { show, inputValue, onEnter }
}

function _open(show: Ref<boolean>) {
  show.value = true
}

function _close(show: Ref<boolean>) {
  show.value = false
}