import type { TagShow, ThreadShow } from "~/types/types-content"
import dbOp from "../db-op"
import valTool from "~/utils/basic/val-tool"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import cui from "~/components/custom-ui"
import { getTagIdsParents } from "~/utils/system/tag-related";

/** 切换是否展示 倒计时 */
export async function setShowCountdown(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {
  const newThread = valTool.copyObject(oldThread)

  // 1. 修改数据
  const cCfg = newThread.config ?? {}
  cCfg.showCountdown = cCfg.showCountdown === false ? true : false
  newThread.config = cCfg

  // 2. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "hourglass")

  // 3. 操作 db
  const res = await dbOp.setContentConfig(newThread._id, cCfg)

  // 4. 展示通知，并回传 promise
  const res2 = await cui.showSnackBar({ text_key: "tip.updated", action_key: "tip.undo" })
  if(res2.result !== "tap") return

  // 发生撤销
  // 5. 通知到全局
  tsStore.setUpdatedThreadShows([oldThread], "hourglass")

  // 6. 修改 db
  const res3 = await dbOp.setContentConfig(newThread._id, oldThread.config)
}


/** 设置新的 tags 
 *   由于使用了弹出确认，无需提供撤销 snackbar
*/
export async function setTags(
  oldThread: ThreadShow,
  newTagShows: TagShow[],
  memberId: string,
  userId: string,
) {
  const newThread = valTool.copyObject(oldThread)

  const tagIds = newTagShows.map(v => v.tagId)
  const tagSearched = getTagIdsParents(tagIds)

  // 1. 修改数据
  newThread.tags = newTagShows.length > 0 ? newTagShows : undefined
  newThread.tagSearched = tagSearched.length > 0 ? tagSearched : undefined

  // 2. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "tag")

  // 3. 操作 db
  const res = await dbOp.setTags(newThread._id, tagIds, tagSearched)
}

