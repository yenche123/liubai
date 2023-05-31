import { db } from "../../db";
import { membersToShows, usersToMemberShows } from "../../other/member-related"

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