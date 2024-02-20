
import { useSystemStore } from "~/hooks/stores/useSystemStore";
import type { 
  Res_UserSettings_Enter, 
  Res_UserSettings_Latest,
} from "~/requests/req-types";
import type { UserLocalTable } from "~/types/types-table";
import localCache from "~/utils/system/local-cache";
import { db } from "~/utils/db";
import time from "~/utils/basic/time";
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import cui from "~/components/custom-ui";
import { LiuSpaceAndMember } from "~/types/types-cloud";

interface AgudOpt {
  isRefresh?: boolean
}

export async function afterGettingUserData(
  d: Res_UserSettings_Enter | Res_UserSettings_Latest,
  rr: RouteAndLiuRouter,
  opt?: AgudOpt,
) {

  console.log("afterGettingUserData.......")
  console.log(d)
  console.log(" ")
  const { local_id: userId } = localCache.getPreference()
  if(!userId) return false

  // 1. update theme & language
  const systemStore = useSystemStore()
  systemStore.setTheme(d.theme)
  systemStore.setLanguage(d.language)


  // 2. get user data and construct new data
  const res2 = await db.users.get(userId)
  if(!res2) return false
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
  
  // 3. update user
  const res3 = await db.users.update(userId, u)

  // 4. update name and avatar
  const res4 = await handleWorkspace(d.spaceMemberList, rr)
  if(!res4) return res4
  
  


}

export async function handleWorkspace(
  spaceMemberList: LiuSpaceAndMember[],
  rr: RouteAndLiuRouter,
) {
  const wStore = useWorkspaceStore()
  const currentSpaceId = wStore.spaceId
  if(!currentSpaceId) return true

  const theSpace = spaceMemberList.find(v => v.spaceId === currentSpaceId)
  if(!theSpace) {
    await cui.showModal({ 
      title_key: "tip.tip",
      content_key: "tip.workspace_1",
      showCancel: false,
    })
    rr.router.goHome()
    return false
  }

  if(theSpace.space_oState !== "OK") {
    await cui.showModal({ 
      title_key: "tip.tip",
      content_key: "tip.workspace_3",
      showCancel: false,
    })
    rr.router.goHome()
    return false
  }

  if(theSpace.member_oState === "LEFT") {
    await cui.showModal({ 
      title_key: "tip.tip",
      content_key: "tip.workspace_2",
      showCancel: false,
    })
    rr.router.goHome()
    return false
  }

  // find workspaces from db and check


  // find members from db and check


}