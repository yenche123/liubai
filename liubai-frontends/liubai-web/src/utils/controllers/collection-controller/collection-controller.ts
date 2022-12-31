import type { CollectionLocalTable } from "../../../types/types-table"
import { db } from "../../db"
import { getLocalPreference } from "../../system/local-preference"
import type { TcListOption } from "../thread-controller/type"
import { getMemberShows, getEditedStr } from "../equip-content/equip-content"
import type { TagShow, ThreadShow } from "../../../types/types-content";
import imgHelper from "../../images/img-helper"
import type { TipTapJSONContent } from "../../../types/types-editor";
import { tagIdsToShows } from "../../system/workspace";
import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore"
import { getBriefing } from "../equip-content/tools/briefing";
import liuUtil from "../../liu-util"
import commonPack from "../tools/common-pack"
interface MyCollectionOpt {
  content_ids: string[]
}

// 根据 contents 的 id 来获取我的收藏或点赞
async function getMyCollectionByIds(opt: MyCollectionOpt) {

  const { local_id: user_id } = getLocalPreference()
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
export async function getThreadsByCollectionOrEmoji(
  opt: TcListOption
) {
  const { 
    workspace = "ME", 
    sort = "desc",
    lastItemStamp,
    limit = 16,
    emojiSpecific,
    collectType,
  } = opt ?? {}

  const wStore = useWorkspaceStore()
  const { local_id: user_id } = getLocalPreference()
  let res: CollectionLocalTable[] = []

  const filterFunc = (item: CollectionLocalTable) => {
    // console.log("opt::: ", opt)
    // console.log("item:::", item)
    // console.log(" ")
    if(item.oState !== "OK") return false
    if(user_id !== item.user) return false
    if(collectType !== item.infoType) return false
    if(item.forType !== "THREAD") return false
    if(item.workspace !== workspace) return false
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
  const member_ids = [...new Set(res2.map(v => v.member))]
  const members = await getMemberShows(member_ids)

  let list: ThreadShow[] = []
  for(let i=0; i<res.length; i++) {
    const c = res[i]
    const v = res2.find(v1 => v1._id === c.content_id)
    if(!v) continue
    const { 
      member: m, 
      _id, 
      user: u, 
      liuDesc, 
      workspace: w, 
      title
    } = v

    let myFavorite = false
    let myFavoriteStamp: number | undefined
    let myEmoji = ""
    let myEmojiStamp: number | undefined
    if(c.infoType === "EXPRESS") {
      myEmoji = c.emoji ?? ""
      myEmojiStamp = c.insertedStamp
    }
    else if(c.infoType === "FAVORITE") {
      myFavorite = c.oState === "OK"
      myFavoriteStamp = c.insertedStamp
    }

    let creator = members.find(v2 => v2._id === m)
    let isMine = false
    if(u && user_id && u === user_id) isMine = true

    const images = v.images?.map(v2 => {
      return imgHelper.imageLocalToShow(v2)
    })

    let newDesc = commonPack.packLiuDesc(liuDesc, title)
    let tiptapContent: TipTapJSONContent | undefined = newDesc?.length 
      ? { type: "doc", content: newDesc } : undefined

    let tags: TagShow[] = []
    // 判断当前工作区与当前动态是否匹配
    let canTag = w === "ME" && u === user_id && !wStore.isCollaborative
    if(!canTag) canTag = w === wStore.spaceId
    // 如果动态所属的工作区与当前工作区匹配
    if(canTag) {
      const tagData = v.tagIds ? tagIdsToShows(v.tagIds) : undefined
      tags = tagData?.tagShows ?? []
    }

    const obj: ThreadShow = {
      _id,
      cloud_id: v.cloud_id,
      insertedStamp: v.insertedStamp,
      updatedStamp: v.updatedStamp,
      oState: v.oState,
      user_id: u,
      member_id: m,
      workspace: w,
      visScope: v.visScope,
      storageState: v.storageState,
      title,
      content: tiptapContent,
      briefing: getBriefing(liuDesc),
      images,
      files: v.files,
      whenStamp: v.whenStamp,
      remindStamp: v.remindStamp,
      remindMe: v.remindMe,
      creator,
      isMine,
      myFavorite,
      myFavoriteStamp,
      myEmoji,
      myEmojiStamp,
      commentNum: v.commentNum ?? 0,
      emojiData: v.emojiData,
      pinStamp: v.pinStamp,
      createdStamp: v.createdStamp,
      editedStamp: v.editedStamp,
      createdStr: liuUtil.showBasicDate(v.createdStamp),
      editedStr: getEditedStr(v.createdStamp, v.editedStamp),
      tags,
      tagSearched: v.tagSearched,
    }

    list.push(obj)
  }

  return list
}


export default {
  getMyCollectionByIds,
}