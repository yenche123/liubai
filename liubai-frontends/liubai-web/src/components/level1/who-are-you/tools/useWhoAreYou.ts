import { computed, ref, type Ref } from "vue";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import middleBridge from "~/utils/middle-bridge";

export function useWhoAreYou() {
  const wStore = useWorkspaceStore()
  const show = ref(false)
  const inputValue = ref("")
  const trimVal = computed(() => {
    const iv = inputValue.value
    return iv.trim()
  })

  wStore.$subscribe((mutation, state) => {
    const myMember = state.myMember
    // console.log("看一下 myMember: ", myMember)
    // console.log(" ")
    if(!myMember) return
    if(!myMember.name) _open(show)
  })

  const onEnter = async () => {
    const val = inputValue.value.trim()
    if(!val) return
    
    _close(show)
    middleBridge.modifyMemberNickname(val)
  }

  return { show, inputValue, trimVal, onEnter }
}

function _open(show: Ref<boolean>) {
  show.value = true
}

function _close(show: Ref<boolean>) {
  show.value = false
}