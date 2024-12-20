// 将 ContentLocalTable 转为 CommentShow
import type { ContentLocalTable } from "~/types/types-table";
import type { CommentShow, MemberShow } from "~/types/types-content";
import { 
  getMemberShows,
  getUserAndMemberIdsFromContents,
} from "./other-tool";
import localCache from "~/utils/system/local-cache";
import collectionController from "../collection-controller/collection-controller";
import showComment from "~/utils/show/show-comment";

/** 将 contents 转为 CommentShow */
export async function equipComments(
  contents: ContentLocalTable[]
) {
  if(contents.length < 1) return []

  const { local_id: user_id } = localCache.getPreference()
  const { member_ids } = getUserAndMemberIdsFromContents(contents)

  const memberShows = await getMemberShows(member_ids)
  const content_ids = contents.map(v => v._id)
  const collections = await collectionController.getMyCollectionByIds({ content_ids })

  let list: CommentShow[] = []
  for(let i=0; i<contents.length; i++) {
    const v = contents[i]
    const { member, user, _id, infoType } = v
    if(infoType !== "COMMENT") continue

    const _collections = collections.filter(v2 => v2.content_id === _id)
    let creator: MemberShow | undefined = undefined
    if(member) {
      creator = memberShows.find(v2 => v2._id === member)
    }

    const obj = showComment.packComment(v, _collections, creator, user_id)
    list.push(obj)
  }
  return list
}