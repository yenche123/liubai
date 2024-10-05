import { defineStore } from "pinia";
import { ref } from "vue";
import valTool from "~/utils/basic/val-tool";
import type { TagView, LiuStateConfig } from "~/types/types-atom";
import type { MemberLocalTable, WorkspaceLocalTable } from "~/types/types-table";
import { db } from "~/utils/db";
import type { SpaceType } from "~/types/types-basic";
import type { MemberConfig } from "~/types/other/types-custom";
import type { UserSubscription } from "~/types/types-cloud";
import time from "~/utils/basic/time";

export interface AboutMeOpt {

  userId: string
  serial?: string
  token?: string

  spaceId: string
  memberId: string
  isCollaborative: boolean
  currentSpace?: WorkspaceLocalTable
  myMember?: MemberLocalTable

  userSubscription?: UserSubscription
}

export const useWorkspaceStore = defineStore("workspace", () => {

  const userId = ref("")
  const serial = ref<string | undefined>()
  const token = ref<string | undefined>()

  const spaceId = ref("")
  const spaceType = ref<SpaceType | "">("")
  const memberId = ref("")
  const workspace = ref("")    // 协作工作区时，是对应的 spaceId；个人工作区时是 ME
  const isCollaborative = ref(false)
  const userSubscription = ref<UserSubscription | null>(null)
  const isPremium = ref(false)

  const currentSpace = ref<WorkspaceLocalTable | null>(null)
  const myMember = ref<MemberLocalTable | null>(null)

  // 我有在的工作区 id 们
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

  const setDataAboutMe = (opt: AboutMeOpt) => {
    userId.value = opt.userId
    token.value = opt.token
    serial.value = opt.serial
    spaceType.value = opt.isCollaborative ? "TEAM" : "ME"
    spaceId.value = opt.spaceId
    memberId.value = opt.memberId
    isCollaborative.value = opt.isCollaborative
    workspace.value = opt.isCollaborative ? opt.spaceId : "ME"
    currentSpace.value = opt.currentSpace ?? null
    myMember.value = opt.myMember ?? null
    userSubscription.value = opt.userSubscription ?? null
    isPremium.value = getPremium(opt.userSubscription)
  }

  const updateSerialAndToken = (newSerial: string, newToken: string) => {
    serial.value = newSerial
    token.value = newToken
  }

  const setNickName = async (val: string) => {
    if(!myMember.value) return
    const res = await db.members.update(myMember.value._id, { name: val })
    myMember.value.name = val
  }

  const setTagList = async (list: TagView[]) => {
    const spaceVal = currentSpace.value
    if(!spaceVal) return
    const tmpList = valTool.copyObject(list)
    const res = await db.workspaces.update(spaceVal._id, { tagList: tmpList })
    spaceVal.tagList = list
    return true
  }

  // 设置 member 的 conifg
  const setMemberConfig = async (memberCfg: MemberConfig) => {
    const memberVal = myMember.value
    if(!memberVal) return
    const copyData = valTool.copyObject(memberCfg)
    const res = await db.members.update(memberVal._id, { config: copyData })
    memberVal.config = memberCfg
    return true
  }

  // 设置 状态 配置
  const setStateConfig = async (stateConfig?: LiuStateConfig) => {
    const spaceVal = currentSpace.value
    if(!spaceVal) return
    const copyData = valTool.copyObject(stateConfig)
    const res = await db.workspaces.update(spaceVal._id, { stateConfig: copyData })
    spaceVal.stateConfig = stateConfig
    return true
  }

  const setMySpaceIds = (list: string[]) => {
    mySpaceIds.value = list
  }

  const logout = () => {
    userId.value = ""
    token.value = undefined
    serial.value = undefined
    spaceId.value = ""
    spaceType.value = ""
    memberId.value = ""
    workspace.value = ""
    isCollaborative.value = false
    currentSpace.value = null
    myMember.value = null
    mySpaceIds.value = []
    userSubscription.value = null
    isPremium.value = false
  }


  const setWorkspaceAfterUpdatingDB = (w: WorkspaceLocalTable) => {
    if(spaceId.value !== w._id) return
    currentSpace.value = w
  }

  const setMemberAfterUpdatingDB = (m: MemberLocalTable) => {
    if(memberId.value !== m._id) return
    myMember.value = m
  }

  const setSubscriptionAfterUpdatingDB = (newUserSub?: UserSubscription) => {
    userSubscription.value = newUserSub ?? null
    isPremium.value = getPremium(newUserSub)
  }

  return { 
    userId,
    token,
    serial,
    spaceType,
    spaceId, 
    memberId,
    workspace,
    isCollaborative, 
    currentSpace,
    myMember,
    mySpaceIds,
    userSubscription,
    isPremium,
    getStateList,
    getStatesNoInIndex,
    setDataAboutMe,
    setNickName,
    setTagList,
    setMemberConfig,
    setStateConfig,
    setMySpaceIds,
    updateSerialAndToken,
    logout,
    setWorkspaceAfterUpdatingDB,
    setMemberAfterUpdatingDB,
    setSubscriptionAfterUpdatingDB,
  }
})

export type WorkspaceStore = ReturnType<typeof useWorkspaceStore>

function getPremium(sub?: UserSubscription) {
  if(!sub) return false
  if(sub.isOn === "N") return false
  if(sub.isLifelong) return true
  const stamp = sub.expireStamp ?? 1
  const now = time.getTime()
  return stamp > now
}