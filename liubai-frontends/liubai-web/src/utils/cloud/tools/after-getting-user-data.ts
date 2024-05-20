
import { useSystemStore } from "~/hooks/stores/useSystemStore";
import type { 
  Res_UserSettings_Enter, 
  Res_UserSettings_Latest,
} from "~/requests/req-types";
import type { 
  MemberLocalTable, 
  UserLocalTable, 
  WorkspaceLocalTable, 
} from "~/types/types-table";
import localCache from "~/utils/system/local-cache";
import { db } from "~/utils/db";
import time from "~/utils/basic/time";
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import cui from "~/components/custom-ui";
import type { LiuSpaceAndMember } from "~/types/types-cloud";
import { CloudFiler } from "../CloudFiler";
import liuConsole from "~/utils/debug/liu-console";

interface AgudOpt {
  isRefresh?: boolean   // `false` is default
}

export async function afterGettingUserData(
  d: Res_UserSettings_Enter | Res_UserSettings_Latest,
  rr: RouteAndLiuRouter,
  opt?: AgudOpt,
) {

  const { local_id: userId } = localCache.getPreference()
  if(!userId) return false

  // 1. update theme & language
  const systemStore = useSystemStore()
  systemStore.setTheme(d.theme)
  systemStore.setLanguage(d.language)

  // 2. get user data and construct new data
  const res2 = await handleUser(userId, d, opt)
  if(!res2) return false

  // 3. update name and avatar with space and member
  const res3 = await handleSpaceAndMember(d.spaceMemberList, rr)
  if(!res3) return false

  // 4. update liuConsole's context
  await liuConsole.setUserTagsCtx()
  
  return true
}


async function handleUser(
  userId: string,
  d: Res_UserSettings_Enter | Res_UserSettings_Latest,
  opt?: AgudOpt,
) {
  const res1 = await db.users.get(userId)
  if(!res1) return false
  const now = time.getTime()
  const u: Partial<UserLocalTable> = {
    subscription: d.subscription,
    email: d.email,
    github_id: d.github_id,
    updatedStamp: now,
  }
  if(opt?.isRefresh) {
    u.lastRefresh = now
  }
  
  const res2 = await db.users.update(userId, u)
  return true
}


async function handleSpaceAndMember(
  spaceMemberList: LiuSpaceAndMember[],
  rr: RouteAndLiuRouter,
) {
  const wStore = useWorkspaceStore()
  const currentSpaceId = wStore.spaceId
  if(!currentSpaceId) return true

  // 1. check if the current space exists
  const currentSpace = spaceMemberList.find(v => v.spaceId === currentSpaceId)
  if(!currentSpace) {
    await cui.showModal({ 
      title_key: "tip.tip",
      content_key: "tip.workspace_1",
      showCancel: false,
    })
    rr.router.goHome()
    return false
  }

  // 2. check if the current space is available
  if(currentSpace.space_oState !== "OK") {
    const uSpace: Partial<WorkspaceLocalTable> = {
      oState: currentSpace.space_oState,
      updatedStamp: time.getTime(),
    }
    db.workspaces.update(currentSpaceId, uSpace)
    await cui.showModal({ 
      title_key: "tip.tip",
      content_key: "tip.workspace_3",
      showCancel: false,
    })
    rr.router.goHome()
    return false
  }

  // 3. check if I am in the current space
  if(currentSpace.member_oState === "LEFT") {
    if(wStore.memberId) {
      const uMember: Partial<MemberLocalTable> = {
        oState: currentSpace.member_oState,
        updatedStamp: time.getTime(),
      }
      db.members.update(wStore.memberId, uMember)
    }
    await cui.showModal({ 
      title_key: "tip.tip",
      content_key: "tip.workspace_2",
      showCancel: false,
    })
    rr.router.goHome()
    return false
  }

  // 4. find workspaces from db and check
  const space_ids = spaceMemberList.map(v => v.spaceId)
  const wClause4 = db.workspaces.where("_id")
  const local_spaces = await wClause4.anyOf(space_ids).toArray()

  // 5. update workspaces
  for(let i=0; i<local_spaces.length; i++) {
    const v1 = local_spaces[i]
    const v2 = spaceMemberList.find(v => v.spaceId === v1._id)
    if(!v2) continue

    let updated = false
    const u5: Partial<WorkspaceLocalTable> = {
      updatedStamp: time.getTime(),
    }

    // check oState
    if(v1.oState !== v2.space_oState) {
      u5.oState = v2.space_oState
      updated = true
    }

    // check name
    if(v1.name !== v2.space_name) {
      u5.name = v2.space_name
      updated = true
    }

    // check infoType
    if(v1.infoType !== v2.spaceType) {
      u5.infoType = v2.spaceType
      updated = true
    }

    // check owner
    if(v1.owner !== v2.space_owner) {
      u5.owner = v2.space_owner
      updated = true
    }

    // check avatar
    const avatarRes = CloudFiler.imageFromCloudToStore(v2.space_avatar, v1.avatar)
    if(avatarRes.useCloud) {
      u5.avatar = avatarRes.image
      updated = true
    }
    
    if(updated) {
      await db.workspaces.update(v1._id, u5)
      const newSpace: WorkspaceLocalTable = { ...v1, ...u5 }
      wStore.setWorkspaceAfterUpdatingDB(newSpace)
    }
    else {
      // console.log("no need to update workspace: " + v1._id)
    }

    if(avatarRes.useCloud) {
      CloudFiler.notify("workspaces", v1._id)
    }
  }

  // 6. find members from db and check
  const member_ids = spaceMemberList.map(v => v.memberId)
  const wClause6 = db.members.where("_id")
  const local_members = await wClause6.anyOf(member_ids).toArray()

  // 7. update members
  for(let i=0; i<local_members.length; i++) {
    const v1 = local_members[i]
    const v2 = spaceMemberList.find(v => v.memberId === v1._id)
    if(!v2) continue

    let updated = false
    const u7: Partial<MemberLocalTable> = {}

    // check oState
    if(v1.oState !== v2.member_oState) {
      u7.oState = v2.member_oState
      updated = true
    }

    if(v1.name !== v2.member_name) {
      u7.name = v2.member_name
      updated = true
    }

    // check avatar
    const avatarRes = CloudFiler.imageFromCloudToStore(v2.member_avatar, v1.avatar)
    if(avatarRes.useCloud) {
      u7.avatar = avatarRes.image
      updated = true
    }
    
    if(updated) {
      u7.updatedStamp = time.getTime()
      await db.members.update(v1._id, u7)
      const newMember: MemberLocalTable = { ...v1, ...u7 }
      wStore.setMemberAfterUpdatingDB(newMember)
    }
    else {
      // console.log("no need to update member: " + v1._id)
    }

    if(avatarRes.useCloud) {
      CloudFiler.notify("members", v1._id)
    }
  }

  return true
}