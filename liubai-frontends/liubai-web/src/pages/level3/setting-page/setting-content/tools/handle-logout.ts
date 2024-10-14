import { db } from "~/utils/db";

export async function deleteLocalData() {
  await db.upload_tasks.clear()
  await db.download_tasks.clear()
  await db.collections.clear()
  await db.drafts.clear()
  await db.contents.clear()
  await db.members.clear()
  await db.workspaces.clear()
  await db.users.clear()
}