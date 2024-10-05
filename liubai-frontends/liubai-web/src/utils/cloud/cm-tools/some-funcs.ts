import type { 
  LiuDownloadParcel,
} from "~/types/cloud/sync-get/types";
import type { CommentShow, ThreadShow } from "~/types/types-content";

function getIdsForCheckingContents(
  res1: LiuDownloadParcel[],
  local_list: CommentShow[] | ThreadShow[],
) {

  const ids: string[] = []
  if(local_list.length < 1) {
    return ids
  }

  const cloudLength = res1.length
  if(cloudLength < 1) {
    return local_list.map(v => v._id)
  }
  
  local_list.forEach(v => {
    const s = v.storageState
    if(s !== "CLOUD") return
    const data = res1.find(v1 => v1.id === v._id)
    if(data) return
    ids.push(v._id)
  })

  return ids
}

export default {
  getIdsForCheckingContents,
}