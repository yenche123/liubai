

import type { ContentLocalTable } from "~/types/types-table";
import collectionController from "../collection-controller/collection-controller";
import type { MemberShow, ThreadShow } from "~/types/types-content";
import localCache from "../../system/local-cache";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import showThread from "~/utils/show/show-thread";
import { 
  getMemberShows,
  getUserAndMemberIdsFromContents,
} from "./other-tool"
import { useSystemStore } from "~/hooks/stores/useSystemStore";
import { useWindowSize } from "~/hooks/useVueUse";
import { type PackThreadOpt } from "~/utils/show/tools/types";

export async function equipThreads(
  contents: ContentLocalTable[]
): Promise<ThreadShow[]> {
  if(contents.length < 1) return []

  const wStore = useWorkspaceStore()
  const { local_id: user_id } = localCache.getPreference()

  const { member_ids } = getUserAndMemberIdsFromContents(contents)
  const memberShows = await getMemberShows(member_ids)

  const content_ids = contents.map(v => v._id)
  const collections = await collectionController.getMyCollectionByIds({ content_ids })

  let list: ThreadShow[] = []
  const sStore = useSystemStore()
  const { width } = useWindowSize()
  const packOpt: PackThreadOpt = {
    wStore,
    sStore,
    windowWidth: width.value,
    user_id,
  }

  for(let i=0; i<contents.length; i++) {
    const v = contents[i]
    const { member, user, _id, infoType } = v
    if(infoType !== "THREAD") continue

    const _collections = collections.filter(v2 => v2.content_id === _id)
    let creator: MemberShow | undefined = undefined
    if(member) {
      creator = memberShows.find(v2 => v2._id === member)
    }

    let obj = showThread.packThread(v, _collections, creator, packOpt)
    
    list.push(obj)
  }

  return list
}