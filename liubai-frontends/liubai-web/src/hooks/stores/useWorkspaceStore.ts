import { defineStore } from "pinia";
import { ref } from "vue";
import { MemberLocalTable, WorkspaceLocalTable } from "../../types/types-table";
import { db } from "../../utils/db";


export interface SpaceAndMemberOpt {
  spaceId: string
  memberId: string
  isCollaborative: boolean
  currentSpace?: WorkspaceLocalTable
  myMember?: MemberLocalTable
}

export const useWorkspaceStore = defineStore("workspaceState", () => {

  const spaceId = ref("")
  const memberId = ref("")
  const isCollaborative = ref(false)

  const currentSpace = ref<WorkspaceLocalTable | null>(null)
  const myMember = ref<MemberLocalTable | null>(null)

  const setSpaceAndMember = (opt: SpaceAndMemberOpt) => {
    spaceId.value = opt.spaceId
    memberId.value = opt.memberId
    isCollaborative.value = opt.isCollaborative
    currentSpace.value = opt.currentSpace ?? null
    myMember.value = opt.myMember ?? null
  }

  const setNickName = async (val: string) => {
    if(!myMember.value) return
    myMember.value.name = val
    const res = await db.members.update(myMember.value._id, { name: val })
    console.log("查看修改 myMember 的结果......")
    console.log(res)
  }

  return { 
    spaceId, 
    memberId,
    isCollaborative, 
    currentSpace,
    myMember,
    setSpaceAndMember,
    setNickName 
  }
})

export type WorkspaceStore = ReturnType<typeof useWorkspaceStore>