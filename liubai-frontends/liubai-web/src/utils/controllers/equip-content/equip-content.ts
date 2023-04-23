// 给定 ContentLocalTable 返回 ThreadShow

import type { ContentLocalTable } from "~/types/types-table";
import { db } from "../../db";
import collectionController from "../collection-controller/collection-controller";
import type { MemberShow, ThreadShow } from "~/types/types-content";
import localCache from "../../system/local-cache";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { membersToShows, usersToMemberShows } from "../../other/member-related"
import showThread from "~/utils/show/show-thread";

export async function equipThreads(contents: ContentLocalTable[]): Promise<ThreadShow[]> {
  if(contents.length < 1) return []

  const wStore = useWorkspaceStore()
  const { local_id: user_id } = localCache.getLocalPreference()


  let user_ids: string[] = []
  let member_ids: string[] = []
  contents.forEach(v => {
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

  const content_ids = contents.map(v => v._id)
  const collections = await collectionController.getMyCollectionByIds({ content_ids })

  // console.time("equip-content")

  let list: ThreadShow[] = []
  for(let i=0; i<contents.length; i++) {
    const v = contents[i]
    const { member, user, _id } = v

    const _collections = collections.filter(v2 => v2.content_id === _id)
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

  // console.timeEnd("equip-content")

  return list
}

export async function getMemberShows(member_ids: string[]) {
  if(member_ids.length < 1) return []
  const res = await db.members.where("_id").anyOf(member_ids).toArray()
  const list = membersToShows(res)
  return list
}

export async function getMemberShowsFromUsers(user_ids: string[]) {
  if(user_ids.length < 1) return []
  const res = await db.users.where("_id").anyOf(user_ids).toArray()
  const list = usersToMemberShows(res)
  return list
}