// 给定 ContentLocalTable 返回 ThreadShow

import type { ContentLocalTable } from "~/types/types-table";
import { db } from "../../db";
import collectionController from "../collection-controller/collection-controller";
import type { ThreadShow } from "~/types/types-content";
import localCache from "../../system/local-cache";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { membersToShows } from "../../other/member-related"
import showThread from "~/utils/show/show-thread";

export async function equipThreads(contents: ContentLocalTable[]): Promise<ThreadShow[]> {
  if(contents.length < 1) return []

  const wStore = useWorkspaceStore()
  const { local_id: user_id } = localCache.getLocalPreference()

  const content_ids = contents.map(v => v._id)
  const member_ids = [...new Set(contents.map(v => v.member))]

  const members = await getMemberShows(member_ids)
  const collections = await collectionController.getMyCollectionByIds({ content_ids })

  // console.time("equip-content")

  let list: ThreadShow[] = []
  for(let i=0; i<contents.length; i++) {
    const v = contents[i]
    const { member, _id } = v

    const _collections = collections.filter(v2 => v2.content_id === _id)
    let creator = members.find(v2 => v2._id === member)
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