import type { MemberLocalTable } from "~/types/types-table";
import type { MemberShow } from "~/types/types-content";
import imgHelper from "../images/img-helper";

export function membersToShows(res: MemberLocalTable[]) {
  const list = res.map(v => {
    const obj: MemberShow = {
      _id: v._id,
      name: v.name,
      avatar: v.avatar ? imgHelper.imageStoreToShow(v.avatar) : undefined,
      spaceId: v.spaceId,
      oState: v.oState,
    }
    return obj
  })
  return list
}