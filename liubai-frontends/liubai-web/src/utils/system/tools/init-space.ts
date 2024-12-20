import { watch } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import { db } from "../../db"
import localCache from "../local-cache"
import type { 
  AboutMeOpt, 
  WorkspaceStore,
} from "~/hooks/stores/useWorkspaceStore"
import typeCheck from "~/utils/basic/type-check"
import time from "~/utils/basic/time"
import liuConsole from "~/utils/debug/liu-console"

let routeChangeNum = 0
let lastRouteChange = 0

// 初始化工作区
export function initSpace(
  store: WorkspaceStore
) {
  // 在 <App /> 的 setup 周期内 route.name 为 undefined
  const { route } = useRouteAndLiuRouter()

  watch(route, (newV) => {
    routeChangeNum++
    // console.log("routeChangeNum: ", routeChangeNum)
    whenRouteChange(store, newV)
  }, { immediate: true })
}


// 查找我所在的工作区
async function getMySpaceIds(userId: string) {
  const res = await db.members.where({ user: userId }).toArray()
  const list = res.map(v => v.spaceId)
  return list
}

/** 防抖节流:
 *  目前仅判断启动时（routeChangeNum <= 2），是否多次触发 whenRouteChange
 * @return boolean 返回 true 表示允许继续执行，反之则相反
 */
function _debounce() {
  const now = time.getLocalTime()
  if(routeChangeNum !== 2) {
    lastRouteChange = now
    return true
  }
  const diff = now - lastRouteChange
  // console.log("diff: ", diff)
  lastRouteChange = now
  if(diff < 300) return false
  return true
}

async function whenRouteChange(
  store: WorkspaceStore,
  newV: RouteLocationNormalizedLoaded,
) {
  const { inApp, checkWorkspace } = newV.meta
  if(inApp === false) return

  // 从路由的 params 里寻找 spaceId
  let spaceId = newV.params.workspaceId
  if(spaceId) {
    if(typeCheck.isString(spaceId)) {
      handleCollaborativeSpace(store, spaceId)
    }
    return
  }

  // 只剩 个人工作区的可能了
  // 先检查是否已经在个人工作区里，若是则 return
  // 因为代表已经初始化了
  if(!store.isCollaborative && store.spaceId) return

  // console.log("whenRouteChange 3333333")

  // 再检查是否为 "不必检查 workspace 的页面"
  // 并且 store 中已有 spaceId，那么就忽略
  // 因为 动态详情页、编辑动态页 可能是其他工作区的
  if(checkWorkspace === false && store.spaceId) return

  // 从 IndexedDB 里查找 个人工作区的 spaceId
  const localP = localCache.getPreference()
  const userId = localP.local_id
  if(!userId) return
  if(!_debounce()) return


  // 1. get workspace from db
  const g1 = { infoType: "ME", owner: userId }
  const t1 = performance.now()
  const mySpace = await db.workspaces.get(g1)
  
  
  if(!mySpace) return
  if(store.spaceId === mySpace._id) return

  // 去查找我在该 workspace 的 member_id
  // 可能不存在，没有关系，就置入空字符串 "" 即可
  // 2. get member from db
  const g2 = { spaceId: mySpace._id, user: userId }
  const myMember = await db.members.get(g2)

  // 3. get user
  const myUser = await db.users.get(userId)

  const opt: AboutMeOpt = {
    userId,
    token: localP.token,
    serial: localP.serial,
    spaceId: mySpace._id,
    memberId: myMember?._id ?? "",
    isCollaborative: false,
    currentSpace: mySpace,
    myMember: myMember,
    userSubscription: myUser?.subscription,
  }

  // 检查 mySpaceIds 是否存在，不存在就去查找并赋值
  // 因为 equipThreads 时，判断 标签tag 时会用到
  if(store.mySpaceIds.length < 1) {
    const mySpaceIds = await getMySpaceIds(userId)
    store.setMySpaceIds(mySpaceIds)
  }
  store.setDataAboutMe(opt)
  liuConsole.setUserTagsCtx()

  const t2 = performance.now()
  const consumeStamp = Math.round(t2 - t1)
  const msg = `init data about me: ${consumeStamp} ms`
  console.log(msg)
  liuConsole.sendMessage(msg)
}

async function handleCollaborativeSpace(
  store: WorkspaceStore,
  newSpaceId: string,
) {
  if(store.spaceId === newSpaceId) return
  const localP = localCache.getPreference()
  const userId = localP.local_id
  if(!userId) return

  const opt: AboutMeOpt = {
    userId,
    token: localP.token,
    serial: localP.serial,
    spaceId: newSpaceId,
    memberId: "",
    isCollaborative: true,
  }
  
  // 1. 本地查找 workspace
  const workspace = await db.workspaces.get({ _id: newSpaceId })
  if(!workspace) {
    // TODO【待完善】去远端查找
    store.setDataAboutMe(opt)
    return
  }
  opt.isCollaborative = workspace.infoType === "TEAM"

  // 2. 本地查找 member
  const g = { spaceId: newSpaceId, user: userId }
  const member = await db.members.get(g)
  opt.memberId = member?._id ?? ""
  opt.myMember = member

  // 3. get my user
  const myUser = await db.users.get(userId)
  opt.userSubscription = myUser?.subscription

  // 4. 检查 mySpaceIds 是否存在
  if(store.mySpaceIds.length < 1) {
    const mySpaceIds = await getMySpaceIds(userId)
    store.setMySpaceIds(mySpaceIds)
  }

  store.setDataAboutMe(opt)
  liuConsole.setUserTagsCtx()
}