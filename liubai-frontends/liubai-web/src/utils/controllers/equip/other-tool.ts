import { db } from "../../db";
import { membersToShows, usersToMemberShows } from "../../other/member-related"
import type { ContentLocalTable } from "~/types/types-table"

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

export function getUserAndMemberIdsFromContents(
  contents: ContentLocalTable[]
) {
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

  return { user_ids, member_ids }
}