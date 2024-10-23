import type { RouteItem } from "~/types"
import usefulTool from "~/utils/basic/useful-tool"

export function isSameRoute(r1: RouteItem, r2: RouteItem) {
  if(r1.fullPath !== r2.fullPath) {
    return false
  }

  if(r1.name !== r2.name) {
    return false
  }

  const res2 = usefulTool.isSameSimpleObject(r1.query, r2.query)
  if(!res2) {
    return false
  }

  return true
}