import { db } from "~/utils/db"
import type {
  SearchOpt,
} from "./types"
import type { ContentLocalTable } from "~/types/types-table";
import { getSpaceId, resToAtoms } from "./util";

export async function searchSuggest(param: SearchOpt) {
  let { excludeThreads = [], mode } = param
  let onlyThread = mode === "select_thread"
  let spaceId = getSpaceId()

  const filterFunc = (item: ContentLocalTable) => {
    if(onlyThread && item.infoType !== "THREAD") return false
    if(item.oState !== "OK") return false
    if(excludeThreads.includes(item._id)) return false
    if(spaceId !== item.spaceId) return false
    return true
  }

  let tmp = db.contents.orderBy("editedStamp").filter(filterFunc)
  tmp = tmp.reverse().limit(5)
  let res = await tmp.toArray()
  let list = resToAtoms("suggest", res)

  return list
}