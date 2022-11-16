// 给定 ContentLocalTable 返回 ThreadShow

import { ContentLocalTable } from "../../../types/types-table";
import { db } from "../../db";
import collectionController from "../collection-controller/collection-controller";
import type { MemberShow, ThreadShow } from "../../../types/types-content";
import imgHelper from "../../images/img-helper";
import { getLocalPreference } from "../../system/local-preference";

export async function equipThreads(contents: ContentLocalTable[]): Promise<ThreadShow[]> {

  const { local_id: user_id } = getLocalPreference()
  if(contents.length < 1) return []

  const content_ids = contents.map(v => v._id)
  const member_ids = [...new Set(contents.map(v => v.member))]

  const members = await _getMemberShows(member_ids)
  const collections = await collectionController.getMyCollectionByIds({ content_ids })

  let list: ThreadShow[] = []
  for(let i=0; i<contents.length; i++) {
    const v = contents[i]
    const { member, _id, user } = v

    let myFavorite = collections.some(v2 => v2.content_id === _id && v2.infoType === "FAVORITE")
    let myEmoji = ""
    collections.forEach(v2 => {
      if(v2.content_id === _id && v2.infoType === "EXPRESS" && v2.emoji) myEmoji = v2.emoji
    })

    let creator = members.find(v2 => v2._id === member)
    let isMine = false
    if(user && user_id && user === user_id) isMine = true

    const images = v.images?.map(v2 => {
      return imgHelper.imageLocalToShow(v2)
    })

    const obj: ThreadShow = {
      _id,
      cloud_id: v.cloud_id,
      insertedStamp: v.insertedStamp,
      updatedStamp: v.updatedStamp,
      oState: v.oState,
      user_id: user,
      member_id: member,
      workspace: v.workspace,
      visScope: v.visScope,
      storageState: v.storageState,
      title: v.title,
      liuDesc: v.liuDesc,
      images,
      files: v.files,
      whenStamp: v.whenStamp,
      remindMe: v.remindMe,
      creator,
      isMine,
      myFavorite,
      myEmoji,
      commentNum: v.commentNum ?? 0,
      emojiData: v.emojiData,
      createdStamp: v.createdStamp,
      editedStamp: v.editedStamp,
    }

    list.push(obj)
  }

  return list
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