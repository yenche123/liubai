// 给定 ContentLocalTable 返回 ThreadShow

import type { ContentLocalTable } from "~/types/types-table";
import { db } from "../../db";
import collectionController from "../collection-controller/collection-controller";
import type { StateShow, TagShow, ThreadShow } from "~/types/types-content";
import imgHelper from "../../images/img-helper";
import localCache from "../../system/local-cache";
import type { TipTapJSONContent } from "~/types/types-editor";
import liuUtil from "../../liu-util";
import { tagIdsToShows } from "../../system/tag-related";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import commonPack from "../tools/common-pack";
import { membersToShows } from "../../other/member-related"

export async function equipThreads(contents: ContentLocalTable[]): Promise<ThreadShow[]> {

  const wStore = useWorkspaceStore()
  const { local_id: user_id } = localCache.getLocalPreference()
  if(contents.length < 1) return []

  const content_ids = contents.map(v => v._id)
  const member_ids = [...new Set(contents.map(v => v.member))]

  const members = await getMemberShows(member_ids)
  const collections = await collectionController.getMyCollectionByIds({ content_ids })

  // console.time("equip-content")

  let list: ThreadShow[] = []
  for(let i=0; i<contents.length; i++) {
    const v = contents[i]
    const { member, _id, user, liuDesc, spaceId, title } = v

    let myFavorite = false
    let myFavoriteStamp: number | undefined
    let myEmoji = ""
    let myEmojiStamp: number | undefined
    collections.forEach(v2 => {
      if(v2.content_id === _id && v2.infoType === "EXPRESS" && v2.emoji) {
        myEmoji = v2.emoji
        myEmojiStamp = v2.insertedStamp
      }
      else if(v2.content_id === _id && v2.infoType === "FAVORITE") {
        myFavorite = true
        myFavoriteStamp = v2.insertedStamp
      }
    })

    let creator = members.find(v2 => v2._id === member)
    let isMine = false
    if(user && user_id && user === user_id) isMine = true

    const images = v.images?.map(v2 => {
      return imgHelper.imageStoreToShow(v2)
    })

    let newDesc = commonPack.packLiuDesc(liuDesc, title)
    let tiptapContent: TipTapJSONContent | undefined = newDesc?.length 
      ? { type: "doc", content: newDesc } : undefined
    
    let tags: TagShow[] = []
    let stateShow: StateShow | undefined = undefined
    // 判断当前工作区与当前动态是否匹配，若匹配则可展示标签和状态
    let canTag = spaceId === wStore.spaceId
    // 如果动态所属的工作区与当前工作区匹配
    if(canTag) {
      const tagData = v.tagIds ? tagIdsToShows(v.tagIds) : undefined
      tags = tagData?.tagShows ?? []
      stateShow = commonPack.getStateShow(v.stateId, wStore)
    }
    

    const obj: ThreadShow = {
      _id,
      cloud_id: v.cloud_id,
      insertedStamp: v.insertedStamp,
      updatedStamp: v.updatedStamp,
      oState: v.oState,
      user_id: user,
      member_id: member,
      spaceId,
      spaceType: v.spaceType,
      visScope: v.visScope,
      storageState: v.storageState,
      title,
      content: tiptapContent,
      briefing: commonPack.getBriefing(newDesc),
      summary: commonPack.getSummary(liuDesc, v.files),
      images,
      imgLayout: imgHelper.getImgLayout(images),
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
      editedStr: liuUtil.getEditedStr(v.createdStamp, v.editedStamp),
      tags,
      tagSearched: v.tagSearched,
      stateId: v.stateId,
      stateShow,
      config: v.config,
    }

    // if(obj.briefing) {
    //   console.log("看一下 briefing: ")
    //   console.log(obj.briefing)
    //   console.log(" ")
    // }
    
    list.push(obj)
  }

  // console.timeEnd("equip-content")

  return list
}

export async function getMemberShows(member_ids: string[]) {
  if(member_ids.length < 1) return []
  const res = await db.members.where("_id").anyOf(member_ids).toArray()
  const list = membersToShows(res)
  return list
}