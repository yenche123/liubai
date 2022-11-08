import { defineStore } from "pinia";
import { ref } from "vue";

export const useWorkspaceStore = defineStore("workspaceState", () => {
  // 你的昵称
  const spaceId = ref("")
  const nickName = ref("")

  const setSpaceId = (val: string) => {
    spaceId.value = val
  }

  const setNickName = (val: string) => {
    nickName.value = val
    toSetNickName(val)
  }

  return { spaceId, setSpaceId, nickName, setNickName }
})

export type WorkspaceStore = ReturnType<typeof useWorkspaceStore>

// 修改对应的 db.members
function toSetNickName(val: string) {

}