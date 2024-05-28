import type { 
  LiuDownloadParcel,
} from "~/types/cloud/sync-get/types";
import type { CommentShow, ThreadShow } from "~/types/types-content";
import type { ThreadListViewType } from "~/types/types-view";

function getIdsForCheckingContents(
  res1: LiuDownloadParcel[],
  local_list: CommentShow[] | ThreadShow[],
  viewType?: ThreadListViewType,
) {

  const ids: string[] = []
  if(local_list.length < 1) {
    return ids
  }

  const vT = viewType
  local_list.forEach(v => {
    const s = v.storageState
    if(s !== "CLOUD") return
    const data = res1.find(v1 => v1.id === v._id)
    if(data) return

    let stamp = v.createdStamp
    const tmpV = v as ThreadShow

    if(vT === "FAVORITE") {
      stamp = tmpV.myFavoriteStamp ?? 0
    }
    else if(vT === "TRASH") {
      stamp = tmpV.removedStamp ?? 0
    }

    ids.push(v._id)
  })

  return ids
}

export default {
  getIdsForCheckingContents,
}