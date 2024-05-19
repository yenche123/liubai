import type { MemberLocalTable, UserLocalTable } from "~/types/types-table";
import type { MemberShow } from "~/types/types-content";
import imgHelper from "../files/img-helper";

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

export function usersToMemberShows(
  res: UserLocalTable[],
) {
  const list = res.map(v => {
    const obj: MemberShow = {
      user_id: v._id,
      spaceId: "",
      oState: "EXTERNAL",
    }
    return obj
  })
  return list
}