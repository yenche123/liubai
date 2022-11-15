import { watch } from "vue"
import type { WorkspaceStore } from "../../../hooks/stores/useWorkspaceStore"
import { useRouteAndLiuRouter } from "../../../routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import { db } from "../../db"
import { getLocalPreference } from "../local-preference"
import type { SpaceAndMemberOpt } from "../../../hooks/stores/useWorkspaceStore"

export function initSpace(
  store: WorkspaceStore
) {
  // 在 <App /> 的 setup 周期内 route.name 为 undefined
  let routeChangeNum = 0
  const { route } = useRouteAndLiuRouter()

  watch(route, (newV) => {
    routeChangeNum++
    whenRouteChange(store, newV, routeChangeNum)
  })
}

async function whenRouteChange(
  store: WorkspaceStore,
  newV: RouteLocationNormalizedLoaded,
  routeChangeNum: number,
) {

  const inApp = newV.meta.inApp
  if(inApp === false) {
    return
  }

  // 从路由的 params 里寻找 spaceId
  let spaceId = newV.params.workspaceId
  if(spaceId) {
    if(typeof spaceId === 'string') {
      handleCollaborativeSpace(store, spaceId)
    }
    return
  }

  // 只剩 个人工作区的可能了
  // 先检查是否已经在个人工作区里
  if(!store.isCollaborative && store.spaceId) return

  // 从 IndexedDB 里查找 个人工作区的 spaceId
  const localP = getLocalPreference()
  const userId = localP.local_id
  if(!userId) return

  const g = {
    infoType: "ME",
    owner: userId
  }

  console.time("init-space")
  const mySpace = await db.workspaces.get(g)
  console.timeEnd("init-space")
  
  if(!mySpace) return
  if(store.spaceId === mySpace._id) {
    return
  }

  // 去查找我在该 workspace 的 member_id
  // 可能不存在，没有关系，就置入空字符串 "" 即可
  const g2 = {
    workspace: mySpace._id,
    user: userId,
  }
  const myMember = await db.members.get(g2)
  const opt: SpaceAndMemberOpt = {
    spaceId: mySpace._id,
    memberId: myMember?._id ?? "",
    isCollaborative: false,
    currentSpace: mySpace,
    myMember: myMember,
  }

  store.setSpaceAndMember(opt)
}

async function handleCollaborativeSpace(
  store: WorkspaceStore,
  newSpaceId: string,
) {
  if(store.spaceId === newSpaceId) return
  const localP = getLocalPreference()
  const userId = localP.local_id
  if(!userId) return

  const opt: SpaceAndMemberOpt = {
    spaceId: newSpaceId,
    memberId: "",
    isCollaborative: true,
  }
  
  // 1. 本地查找 workspace
  const workspace = await db.workspaces.get({ _id: newSpaceId })
  if(!workspace) {
    // 【待完善】去远端查找
    store.setSpaceAndMember(opt)
    return
  }
  opt.isCollaborative = workspace.infoType === "TEAM"

  // 2. 本地查找 member
  const g = {
    workspace: newSpaceId,
    user: userId,
  }
  const member = await db.members.get(g)
  opt.memberId = member?._id ?? ""
  opt.myMember = member
  store.setSpaceAndMember(opt)
}