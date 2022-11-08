import { defineStore } from "pinia";
import { ref } from "vue";
import type { SpaceType } from "../../types/types-atom";

export const useWorkspaceStore = defineStore("workspaceState", () => {
  // 你的昵称
  const spaceId = ref("")
  const isCollaborative = ref(false)
  const nickName = ref("")

  const setSpace = (val: string, spaceType: SpaceType = "ME") => {
    spaceId.value = val
    isCollaborative.value = spaceType === "TEAM" ? true : false
  }

  const setNickName = (val: string) => {
    nickName.value = val
    toSetNickName(val)
  }

  return { spaceId, isCollaborative, setSpace, nickName, setNickName }
})

export type WorkspaceStore = ReturnType<typeof useWorkspaceStore>

// 修改对应的 db.members
function toSetNickName(val: string) {

}