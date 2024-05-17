import liuEnv from "~/utils/liu-env";
import { useSyncStore, type SyncStoreItem } from "../stores/useSyncStore";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { type RouteLocationNormalized } from "vue-router";
import valTool from "~/utils/basic/val-tool";

export function useIdsChanged() {
  const backend = liuEnv.hasBackend()
  if(!backend) return

  let all_threads: SyncStoreItem[] = []
  let all_comments: SyncStoreItem[] = []

  // pass `to` route representing the current route or the route to be navigated to
  // and then check if the new route is going to be generated
  const _getNewRoute = (to: RouteLocationNormalized) => {    
    let newRoute: RouteLocationNormalized | undefined
    const { params, query } = to

    const threadId = params.contentId
    const commentId = params.commentId

    if(valTool.isStringWithVal(threadId)) {
      const newThreadId = getNewId(threadId, all_threads)
      if(newThreadId) {
        console.log("new thread id in params is found: ", newThreadId)
        console.log("the old id is ", threadId)
        console.log(" ")
        newRoute = addNewParam(to, newRoute, "contentId", newThreadId)
      }
    }
    if(valTool.isStringWithVal(commentId)) {
      const newCommentId = getNewId(commentId, all_comments)
      if(newCommentId) {
        console.log("new thread id is in params found: ", newCommentId)
        console.log("the old id is ", commentId)
        console.log(" ")
        newRoute = addNewParam(to, newRoute, "commentId", newCommentId)
      }
    }

    const cid = query.cid
    const cid2 = query.cid2
    if(valTool.isStringWithVal(cid)) {
      const newCid = getNewId(cid, all_threads)
      if(newCid) {
        console.log("new thread id in query is found: ", newCid)
        console.log("the old id is ", cid)
        console.log(" ")
        newRoute = addNewQuery(to, newRoute, "cid", newCid)
      }
    }
    if(valTool.isStringWithVal(cid2)) {
      const newCid2 = getNewId(cid2, all_comments)
      if(newCid2) {
        console.log("new comment id in query is found: ", newCid2)
        console.log("the old id is ", cid2)
        console.log(" ")
        newRoute = addNewQuery(to, newRoute, "cid2", newCid2)
      }
    }

    if(newRoute) {
      return newRoute
    }
  }

  const rr = useRouteAndLiuRouter()

  // 1. listening to changes in sync store
  const syncStore = useSyncStore()
  syncStore.$subscribe((mutation, state) => {
    let needToCheck = false
    const { threads, comments } = state
    if(threads.length > 0) {
      needToCheck = true
      all_threads.push(...threads)
    }
    if(comments.length > 0) {
      needToCheck = true
      all_comments.push(...comments)
    }

    if(!needToCheck) return
    const newRoute = _getNewRoute(rr.route)
    if(newRoute) rr.router.replace(newRoute)
  })

  // 2. global navigation guard
  rr.router.beforeEach(_getNewRoute)
}



function addNewParam(
  originRoute: RouteLocationNormalized,
  newRoute: RouteLocationNormalized | undefined,
  key: string,
  val: string,
) {
  if(!newRoute) newRoute = { ...originRoute }
  newRoute.params[key] = val
  return newRoute
}

function addNewQuery(
  originRoute: RouteLocationNormalized,
  newRoute: RouteLocationNormalized | undefined,
  key: string,
  val: string,
) {
  if(!newRoute) newRoute = { ...originRoute }
  newRoute.query[key] = val
  return newRoute
}

function getNewId(
  oldId: string,
  list: SyncStoreItem[],
) {
  let newId: string | undefined
  list.forEach(v => {
    if(v.first_id === oldId && v.new_id !== oldId) {
      newId = v.new_id
    }
  })
  return newId
}