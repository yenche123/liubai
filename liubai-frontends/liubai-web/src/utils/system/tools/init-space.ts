import { watch } from "vue"
import type { WorkspaceStore } from "../../../hooks/stores/useWorkspaceStore"
import { useRouteAndLiuRouter } from "../../../routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import { db } from "../../db"
import { getLocalPreference } from "../local-preference"

export function initSpace(
  store: WorkspaceStore
) {
  // 在 <App /> 的 setup 周期内 route.name 为 undefined
  const { route } = useRouteAndLiuRouter()
  watch(route, (newV) => {
    whenRouteChange(store, newV)
  })
}

async function whenRouteChange(
  store: WorkspaceStore,
  newV: RouteLocationNormalizedLoaded
) {

  const inApp = newV.meta.inApp
  if(inApp === false) {
    if(store.spaceId) store.setSpace("")
    return
  }

  // 从路由的 params 里寻找 spaceId
  let spaceId = newV.params.workspaceId
  if(spaceId) {
    if(typeof spaceId === 'string' && spaceId !== store.spaceId) {
      store.setSpace(spaceId, "TEAM")
    }
    return
  }

  // 从 IndexedDB 里查找 个人工作区的 spaceId
  const localP = getLocalPreference()
  const userId = localP.local_id
  if(!userId) return
  const myList = await db.workspaces.where("infoType").equals("ME").and((v) => {
    return v.owner === userId
  }).toArray()

  const mine = myList[0]
  if(!mine) return
  if(store.spaceId === mine._id) {
    return
  }

  store.setSpace(mine._id)
}