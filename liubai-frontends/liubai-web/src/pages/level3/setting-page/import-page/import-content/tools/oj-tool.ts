import { db } from "~/utils/db";

// 【暂时没用到！！】 若后续仍然没用到，记得删除！
// 一些辅助工具函数供 our-json.ts 调用

const memberMap = new Map<string, boolean>()
const workspaceMap = new Map<string, boolean>()

export async function hasThisMember(val: string) {
  const res = memberMap.get(val)
  if(typeof res === "boolean") return res

  const res2 = await db.members.get(val)
  
  if(res2 && res2.oState === "OK") {
    memberMap.set(val, true)
    return true
  }
  
  memberMap.set(val, false)
  return false
}

export async function hasThisWorkspace(val: string) {
  const res = workspaceMap.get(val)
  if(typeof res === "boolean") return res

  const res2 = await db.workspaces.get(val)
  
  if(res2 && res2.oState === "OK") {
    workspaceMap.set(val, true)
    return true
  }
  
  workspaceMap.set(val, false)
  return false
}


export function resetOjTool() {
  memberMap.clear()
  workspaceMap.clear()
}