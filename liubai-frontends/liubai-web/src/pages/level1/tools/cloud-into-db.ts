// 用户远端登录成功后
// 把远端信息 LiuSpaceAndMember 分别存入 users workspaces members 中

import type { LiuSpaceAndMember } from "~/types/types-cloud";
import type { UserLocalTable, WorkspaceLocalTable, MemberLocalTable } from "~/types/types-table";
import { db } from "~/utils/db";
import time from "~/utils/basic/time"
import { CloudToLocal } from "~/utils/cloud/CloudToLocal";

export async function handleUser(
  userId: string,
) {
  const res1 = await db.users.get({ cloud_id: userId })
  if(!res1 || !res1._id) {
    let res2 = await createUser(userId)
    return res2
  }
  return true
}

export async function handleSpaceAndMembers(
  userId: string,
  spaceMemberList: LiuSpaceAndMember[],
) {
  for(let i=0; i<spaceMemberList.length; i++) {
    const v = spaceMemberList[i]

    // 1. 查找 workspace
    const res1 = await db.workspaces.get({ cloud_id: v.spaceId })

    // 1.2 若查无 workspace 就去创建；若存在，无需修改，修改流程交给 enter
    if(!res1 || !res1._id) {
      const res1_2 = await createSpace(v)
      if(!res1_2) {
        return false
      }
    }

    // 2. 查找 member
    const res2 = await db.members.get({ cloud_id: v.memberId })
    if(!res2 || !res2._id) {
      const res2_2 = await createMember(userId, v)
      if(!res2_2) {
        return false
      }
    }
  }
  
  return true
}

async function createSpace(
  v: LiuSpaceAndMember,
) {
  const t = time.getTime()
  const data: WorkspaceLocalTable = {
    _id: v.spaceId,
    cloud_id: v.spaceId,
    infoType: v.spaceType,
    oState: v.space_oState,
    owner: v.space_owner,
    insertedStamp: t,
    updatedStamp: t,
  }
  try {
    await db.workspaces.put(data)
  }
  catch(err) {
    console.warn("在本地置入 workspace 失败.......")
    console.log(err)
    console.log(" ")
    return false
  }
  return true
}

// 先不去管 "云端文件" 转换为 "本地文件" 的问题
async function createMember(
  userId: string,
  v: LiuSpaceAndMember,
) {
  const t = time.getTime()
  const { image: avatar } = CloudToLocal.imageFromCloudToStore(v.member_avatar)
  const data: MemberLocalTable = {
    _id: v.memberId,
    spaceId: v.spaceId,
    insertedStamp: t,
    updatedStamp: t,
    user: userId,
    oState: v.member_oState,
    name: v.member_name,
    avatar,
  }
  try {
    const res = await db.members.add(data)
  }
  catch(err) {
    console.warn("在本地置入 member 失败.......")
    console.log(err)
    console.log(" ")
    return false
  }
  
  return true
}


async function createUser(
  userId: string,
) {
  const t = time.getTime()
  const data: UserLocalTable = {
    _id: userId,
    cloud_id: userId,
    oState: "NORMAL",
    insertedStamp: t,
    updatedStamp: t,
    lastRefresh: t,
  }

  try {
    const res = await db.users.put(data)
  }
  catch(err) {
    console.warn("在本地置入 user 失败.......")
    console.log(err)
    console.log(" ")
    return false
  }
  
  return true
}