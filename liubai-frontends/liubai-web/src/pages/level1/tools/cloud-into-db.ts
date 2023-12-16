// 用户远端登录成功后
// 把远端信息 LiuSpaceAndMember 分别存入 users workspaces members 中

import type { LiuSpaceAndMember } from "~/types/types-cloud";
import type { UserLocalTable } from "~/types/types-table";
import { db } from "~/utils/db";

export async function handleUser(
  userId: string,
  spaceMemberList: LiuSpaceAndMember,
) {
  const res1 = await db.users.get({ cloud_id: userId })
  if(res1?._id) {
    updateUser(res1, spaceMemberList)
  }
  else {
    createUser(userId, spaceMemberList)
  }
  return true
}

async function createUser(
  userId: string,
  spaceMemberList: LiuSpaceAndMember,
) {
  
}

async function updateUser(
  user: UserLocalTable,
  spaceMemberList: LiuSpaceAndMember,
) {
  

  
}