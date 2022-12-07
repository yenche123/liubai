// 给定 ContentLocalTable 返回 ThreadShow

import type { ContentLocalTable } from "../../../types/types-table";
import { db } from "../../db";
import collectionController from "../collection-controller/collection-controller";
import type { MemberShow, TagShow, ThreadShow } from "../../../types/types-content";
import imgHelper from "../../images/img-helper";
import { getLocalPreference } from "../../system/local-preference";
import type { TipTapJSONContent } from "../../../types/types-editor";
import liuUtil from "../../liu-util";
import { getBriefing } from "./tools/briefing";
import { tagIdsToShows } from "../../system/workspace";
import { useWorkspaceStore } from "../../../hooks/stores/useWorkspaceStore";

export async function equipThreads(contents: ContentLocalTable[]): Promise<ThreadShow[]> {

  const wStore = useWorkspaceStore()
  const { local_id: user_id } = getLocalPreference()
  if(contents.length < 1) return []

  const content_ids = contents.map(v => v._id)
  const member_ids = [...new Set(contents.map(v => v.member))]

  const members = await _getMemberShows(member_ids)
  const collections = await collectionController.getMyCollectionByIds({ content_ids })

  console.time("equip-content")

  let list: ThreadShow[] = []
  for(let i=0; i<contents.length; i++) {
    const v = contents[i]
    const { member, _id, user, liuDesc, workspace } = v

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
      return imgHelper.imageLocalToShow(v2)
    })

    let tiptapContent: TipTapJSONContent | undefined = liuDesc?.length 
      ? { type: "doc", content: liuDesc } : undefined
 
    
    let tags: TagShow[] = []
    // 判断当前工作区与当前动态是否匹配
    let canTag = workspace === "ME" && user === user_id && !wStore.isCollaborative
    if(!canTag) canTag = workspace === wStore.spaceId
    // 如果动态所属的工作区与当前工作区匹配
    if(canTag) {
      const tagData = v.tagIds ? tagIdsToShows(v.tagIds) : undefined
      tags = tagData?.tagShows ? tagData.tagShows : []
    }
    

    const obj: ThreadShow = {
      _id,
      cloud_id: v.cloud_id,
      insertedStamp: v.insertedStamp,
      updatedStamp: v.updatedStamp,
      oState: v.oState,
      user_id: user,
      member_id: member,
      workspace,
      visScope: v.visScope,
      storageState: v.storageState,
      title: v.title,
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
      editedStr: _getEditedStr(v.createdStamp, v.editedStamp),
      tags,
      tagSearched: v.tagSearched,
    }

    // if(obj.briefing) {
    //   console.log("看一下 briefing: ")
    //   console.log(obj.briefing)
    //   console.log(" ")
    // }
    
    list.push(obj)
  }

  console.timeEnd("equip-content")

  return list
}

function _getEditedStr(createdStamp: number, editedStamp?: number) {
  if(!editedStamp) return
  if(createdStamp === editedStamp) return
  return liuUtil.showBasicDate(editedStamp)
}

async function _getMemberShows(member_ids: string[]) {
  if(member_ids.length < 1) return []
  const res = await db.members.where("_id").anyOf(member_ids).toArray()
  const list = res.map(v => {
    const obj: MemberShow = {
      _id: v._id,
      name: v.name,
      avatar: v.avatar ? imgHelper.imageLocalToShow(v.avatar) : undefined,
      workspace: v.workspace,
      oState: v.oState,
    }
    return obj
  })
  return list
}