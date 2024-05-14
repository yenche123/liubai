

import type { ContentLocalTable } from "~/types/types-table";
import collectionController from "../collection-controller/collection-controller";
import type { MemberShow, ThreadShow } from "~/types/types-content";
import localCache from "../../system/local-cache";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import showThread from "~/utils/show/show-thread";
import { 
  getMemberShows, 
  getMemberShowsFromUsers,
  getUserAndMemberIdsFromContents
} from "./other-tool"

export async function equipThreads(
  contents: ContentLocalTable[]
): Promise<ThreadShow[]> {
  if(contents.length < 1) return []

  const wStore = useWorkspaceStore()
  const { local_id: user_id } = localCache.getPreference()

  const { user_ids, member_ids } = getUserAndMemberIdsFromContents(contents)

  const memberShows = await getMemberShows(member_ids)
  const membersShows2 = await getMemberShowsFromUsers(user_ids)

  const content_ids = contents.map(v => v._id)
  const collections = await collectionController.getMyCollectionByIds({ content_ids })

  let list: ThreadShow[] = []
  for(let i=0; i<contents.length; i++) {
    const v = contents[i]
    const { member, user, _id, infoType } = v
    if(infoType !== "THREAD") continue

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

  return list
}