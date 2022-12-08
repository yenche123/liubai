import { db } from "../../../db";
import type { WhichTagChange } from "./types";
import { getTagIdsParents } from "../index"

export async function updateContentForTagAcross(
  whichTagChange: WhichTagChange,
) {
  const children = whichTagChange.children ?? []
  const res = await db.contents.where("tagIds").anyOf(children).toArray()
  
  
}