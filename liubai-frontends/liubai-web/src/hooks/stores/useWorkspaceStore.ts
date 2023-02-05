import { defineStore } from "pinia";
import { ref } from "vue";
import valTool from "~/utils/basic/val-tool";
import type { TagView, LiuStateConfig } from "~/types/types-atom";
import type { MemberLocalTable, WorkspaceLocalTable } from "~/types/types-table";
import { db } from "~/utils/db";


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
  const workspace = ref("")    // 协作工作区时，是 spaceId；个人工作区时是 ME
  const isCollaborative = ref(false)

  const currentSpace = ref<WorkspaceLocalTable | null>(null)
  const myMember = ref<MemberLocalTable | null>(null)

  // 我有在的工作区 id
  const mySpaceIds = ref<string[]>([])

  // 获取当前工作区的状态列表
  const getStateList = () => {
    const spaceVal = currentSpace.value
    if(!spaceVal) return []
    const { stateConfig } = spaceVal
    if(!stateConfig) return []
    const tmpList = valTool.copyObject(stateConfig.stateList)
    return tmpList
  }

  // 获取 不在首页展示的 状态
  const getStatesNoInIndex = () => {
    const tmpList = getStateList()
    const list: string[] = []
    tmpList.forEach(v => {
      if(!v.showInIndex) list.push(v.id)
    })
    return list
  }

  const setSpaceAndMember = (opt: SpaceAndMemberOpt) => {
    spaceId.value = opt.spaceId
    memberId.value = opt.memberId
    isCollaborative.value = opt.isCollaborative
    workspace.value = opt.isCollaborative ? opt.spaceId : "ME"
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

  const setTagList = async (list: TagView[]) => {
    const spaceVal = currentSpace.value
    if(!spaceVal) return
    spaceVal.tagList = list
    const tmpList = valTool.copyObject(list)
    const res = await db.workspaces.update(spaceVal._id, { tagList: tmpList })
    console.log("setTagList res: ")
    console.log(res)
    return true
  }

  // 设置 状态 配置
  const setStateConfig = async (stateConfig?: LiuStateConfig) => {
    const spaceVal = currentSpace.value
    if(!spaceVal) return
    spaceVal.stateConfig = stateConfig
    const copyData = valTool.copyObject(stateConfig)
    const res = await db.workspaces.update(spaceVal._id, { stateConfig: copyData })
    return true
  }

  const setMySpaceIds = (list: string[]) => {
    mySpaceIds.value = list
  }

  return { 
    spaceId, 
    memberId,
    workspace,
    isCollaborative, 
    currentSpace,
    myMember,
    mySpaceIds,
    getStateList,
    getStatesNoInIndex,
    setSpaceAndMember,
    setNickName,
    setTagList,
    setStateConfig,
    setMySpaceIds,
  }
})

export type WorkspaceStore = ReturnType<typeof useWorkspaceStore>