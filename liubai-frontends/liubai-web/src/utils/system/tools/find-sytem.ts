import { db } from "../../db";
import localReq from "./local-req";

/**
 * 返回数据是否正常，若不正常要重新创建
 */
export async function findSystem(user_id: string) {

  // 依序查找 users / workspaces / members 的 IndexedDB
  const res1 = await db.users.get({ _id: user_id })
  if(!res1) return false
  if(res1.workspaces.length < 1) {
    await localReq.deleteUser(res1._id)
    return false
  }

  const workspace_local = res1.workspaces[0]
  const res2 = await db.workspaces.get({ _id: workspace_local })
  if(!res2) {
    await localReq.deleteUser(res1._id)
    return false
  }

  const g = {
    user: user_id,
    workspace: workspace_local,
  }
  const res3 = await db.members.get(g)
  if(!res3) {
    await localReq.deleteUser(res1._id)
    await localReq.deleteWorkspace(res2._id)
    return false
  }

  return true
}
