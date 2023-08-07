import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { db } from "~/utils/db";
import type { LiuContentType } from "~/types/types-atom"
import checker from "~/utils/other/checker";

export async function handleEmoji(
  contentId: string,
  forType: LiuContentType,
  encodeStr: string,
) {

  // 0. 获取 userId memberId spaceType spaceId
  const authData = checker.getMyContext()
  if(!authData) return

  // 1. 检查 collection 是否已存在




}