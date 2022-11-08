import { ref } from "vue";
import type { Ref } from "vue";
import { db } from "../../../../utils/db";
import { getLocalPreference } from "../../../../utils/system/local-preference";
import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore";

let spaceId = ""

export function useWhoAreYou() {
  const store = useWorkspaceStore()
  const show = ref(false)
  const inputValue = ref("")

  store.$subscribe((mutation, state) => {
    const newV = state.spaceId
    if(newV !== spaceId) whenSpaceChange(show, newV)
  })

  initCheck(show)

  const onEnter = () => {
    const val = inputValue.value.trim()
    if(!val) return
    saveMyName(val)
    store.setNickName(val)
    _close(show)
  }

  return { show, inputValue, onEnter }
}

function initCheck(
  show: Ref<boolean>,
) {
  const localP = getLocalPreference()
  const userId = localP.local_id
  if(!userId) _open(show)
}

async function whenSpaceChange(
  show: Ref<boolean>,
  newSpaceId: string,
) {
  spaceId = newSpaceId
  const localP = getLocalPreference()
  const userId = localP.local_id
  if(!userId) return
  const myList = await db.members.where("user").equals(userId)
    .and(v => v.workspace === newSpaceId).toArray()
  const mine = myList[0]
  if(!mine) return
  if(!mine.name) _open(show)
}


async function saveMyName(name: string) {
  const localP = getLocalPreference()
  const userId = localP.local_id
  if(!userId) return
  if(!spaceId) return
  const res = await db.members.where("user").equals(userId)
    .and(v => v.workspace === spaceId).modify({ name })
}

function _open(show: Ref<boolean>) {
  show.value = true
}

function _close(show: Ref<boolean>) {
  show.value = false
}