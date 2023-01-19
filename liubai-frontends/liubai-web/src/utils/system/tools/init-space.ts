import { watch } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import { db } from "../../db"
import localCache from "../local-cache"
import type { SpaceAndMemberOpt, WorkspaceStore } from "~/hooks/stores/useWorkspaceStore"

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


// 查找我所在的工作区
async function getMySpaceIds(userId: string) {
  const res = await db.members.where({ user: userId }).toArray()
  const list = res.map(v => v.workspace)
  return list
}

async function whenRouteChange(
  store: WorkspaceStore,
  newV: RouteLocationNormalizedLoaded,
  routeChangeNum: number,
) {

  const { inApp, checkWorkspace } = newV.meta
  const pageName = newV.name
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

  // 再检查是否为 "不必检查 workspace 的页面"
  // 并且 store 中已有 spaceId，那么就忽略
  // 因为 动态详情页、编辑动态页 可能是其他工作区的
  if(checkWorkspace === false && store.spaceId) return

  // 从 IndexedDB 里查找 个人工作区的 spaceId
  const localP = localCache.getLocalPreference()
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

  // 检查 mySpaceIds 是否存在，不存在就去查找并赋值
  // 因为 equip-content 时，判断 标签tag 时会用到
  if(store.mySpaceIds.length < 1) {
    const mySpaceIds = await getMySpaceIds(userId)
    store.setMySpaceIds(mySpaceIds)
  }

  store.setSpaceAndMember(opt)
}

async function handleCollaborativeSpace(
  store: WorkspaceStore,
  newSpaceId: string,
) {
  if(store.spaceId === newSpaceId) return
  const localP = localCache.getLocalPreference()
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

  // 3. 检查 mySpaceIds 是否存在
  if(store.mySpaceIds.length < 1) {
    const mySpaceIds = await getMySpaceIds(userId)
    store.setMySpaceIds(mySpaceIds)
  }

  store.setSpaceAndMember(opt)
}