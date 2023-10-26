import type { CollectionLocalTable } from "~/types/types-table"
import { db } from "../../db"
import localCache from "../../system/local-cache"
import type { TcListOption } from "../thread-controller/type"
import { getMemberShows, getMemberShowsFromUsers } from "../equip/other-tool"
import type { MemberShow, ThreadShow } from "~/types/types-content";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import showThread from "~/utils/show/show-thread"
import cfg from "~/config"

interface MyCollectionOpt {
  content_ids: string[]
}

// 根据 contents 的 id 来获取我的收藏 (fav) 或点赞 (emoji)
async function getMyCollectionByIds(opt: MyCollectionOpt) {

  const { local_id: user_id } = localCache.getLocalPreference()
  if(!user_id) return []

  let tmp = db.collections.where("content_id").anyOf(opt.content_ids)
  tmp = tmp.filter(v => {
    if(v.user === user_id && v.oState === 'OK') return true
    return false
  })
  const res = await tmp.toArray()
  return res
}


/**
 * 从 collection (收藏、喜欢) 的角度来加载 contents
 */
export async function getThreadsByCollection(
  opt: TcListOption
) {
  const { 
    spaceId, 
    sort = "desc",
    lastItemStamp,
    limit = cfg.default_limit_num,
    emojiSpecific,
    collectType,
  } = opt

  const wStore = useWorkspaceStore()
  const { local_id: user_id } = localCache.getLocalPreference()
  let res: CollectionLocalTable[] = []

  const filterFunc = (item: CollectionLocalTable) => {
    if(item.spaceId !== spaceId) return false
    if(item.oState !== "OK") return false
    if(user_id !== item.user) return false
    if(collectType !== item.infoType) return false
    if(item.forType !== "THREAD") return false
    if(emojiSpecific && collectType === "EXPRESS" && emojiSpecific !== item.emoji) return false
    return true
  }

  // 1. 先去加载 collections
  if(!lastItemStamp) {
    // 首次加载
    let tmp = db.collections.orderBy("updatedStamp")
    if(sort === "desc") tmp = tmp.reverse()
    tmp = tmp.filter(filterFunc)
    tmp = tmp.limit(limit)

    res = await tmp.toArray()
  }
  else {
    // 分页加载
    let w = db.collections.where("updatedStamp")
    let tmp = sort === "desc" ? w.below(lastItemStamp) :  w.above(lastItemStamp)
    if(sort === "desc") tmp = tmp.reverse()
    tmp = tmp.filter(filterFunc)
    tmp = tmp.limit(limit)
    res = await tmp.toArray()
  }

  // console.log("查看一下 getListByCollectionOrEmoji 加载出来的 res: ")
  // console.log(res)
  if(!res || res.length < 1) return []

  // 2. 去加载 threads
  const content_ids = [...new Set(res.map(v => v.content_id))]
  let tmp2 = db.contents.where("_id").anyOf(content_ids)
  tmp2 = tmp2.filter(v => v.oState === 'OK')
  const res2 = await tmp2.toArray()
  if(!res2 || res2.length < 1) return []

  // 3. 去加载 作者
  let user_ids: string[] = []
  let member_ids: string[] = []
  res2.forEach(v => {
    if(v.member) {
      if(!member_ids.includes(v.member)) {
        member_ids.push(v.member)
      }
    }
    else if(v.user) {
      if(!user_ids.includes(v.user)) {
        user_ids.push(v.user)
      }
    }
  })

  const memberShows = await getMemberShows(member_ids)
  const membersShows2 = await getMemberShowsFromUsers(user_ids)

  let list: ThreadShow[] = []
  for(let i=0; i<res.length; i++) {
    const c = res[i]
    const v = res2.find(v1 => v1._id === c.content_id)
    if(!v) continue

    const { member, user } = v
    let _collections = [c]
    let creator: MemberShow | undefined = undefined
    if(member) {
      creator = memberShows.find(v2 => v2._id === member)
    }
    if(!creator) {
      creator = membersShows2.find(v2 => v2.user_id === user)
    }

    let obj = showThread.packThread(v, _collections, creator, user_id, wStore)
    list.push(obj)
  }

  return list
}


export default {
  getMyCollectionByIds,
}